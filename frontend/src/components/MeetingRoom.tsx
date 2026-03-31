'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAgora } from '@/hooks/useAgora';
import { useSocket } from '@/hooks/useSocket';
import VideoGrid from './VideoGrid';
import MeetingControls from './MeetingControls';
import NotesPanel from './NotesPanel';
import { meetingApi, aiApi } from '@/lib/api';
import { Meeting } from '@/types';

interface Props {
  roomId: string;
  userId: string;
  userName: string;
}

const POLL_TIMEOUT_MS = 300_000; // 5 minutes
const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

export default function MeetingRoom({ roomId, userId, userName }: Props) {
  const router = useRouter();
  const { join, leave, toggleVideo, toggleAudio, localVideoTrack, remoteUsers, isVideoOn, isAudioOn, joined } =
    useAgora(AGORA_APP_ID);
  const { joinRoom, leaveRoom, on, emit } = useSocket();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await meetingApi.getByRoomId(roomId);
        setMeeting(res.data);

        if (AGORA_APP_ID) {
          await join(roomId, null, userId);
        }

        joinRoom(roomId, userId, userName);
      } catch (error) {
        console.error('Failed to initialize meeting:', error);
      }
    };

    init();

    const cleanup1 = on('user-joined', (...args: unknown[]) => {
      const data = args[0] as { name: string };
      console.log(`${data.name} joined`);
    });
    const cleanup2 = on('user-left', (...args: unknown[]) => {
      const data = args[0] as { userId: string };
      console.log(`User ${data.userId} left`);
    });

    return () => {
      cleanup1?.();
      cleanup2?.();
    };
  }, [roomId, userId, userName]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      emit('recording-started', { roomId });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [roomId, emit]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !meeting) return;

    mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsRecording(false);
    setIsProcessing(true);
    emit('recording-stopped', { roomId });

    await new Promise<void>(resolve => {
      mediaRecorderRef.current!.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        formData.append('meetingId', meeting.id);

        try {
          await aiApi.uploadAudio(formData);
          pollForResults(meeting.id);
        } catch (error) {
          console.error('Upload failed:', error);
          setIsProcessing(false);
        }
        resolve();
      };
    });
  }, [meeting, roomId, emit]);

  const pollForResults = useCallback((meetingId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await meetingApi.getById(meetingId);
        if (res.data.summary) {
          setMeeting(res.data);
          setIsProcessing(false);
          clearInterval(interval);
        }
      } catch {
        // Still processing
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(interval);
      setIsProcessing(false);
    }, POLL_TIMEOUT_MS);
  }, []);

  const handleLeave = useCallback(async () => {
    if (isRecording) await stopRecording();
    await leave();
    leaveRoom(roomId, userId);
    router.push('/dashboard');
  }, [isRecording, leave, leaveRoom, roomId, userId, router, stopRecording]);

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <div className="flex-1 flex flex-col p-6 gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{meeting?.title || 'Meeting Room'}</h1>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-sm text-gray-400">{isRecording ? 'Recording' : 'Not recording'}</span>
          </div>
        </div>

        <div className="flex-1">
          <VideoGrid
            localVideoTrack={localVideoTrack}
            remoteUsers={remoteUsers}
            isVideoOn={isVideoOn}
            userName={userName}
          />
        </div>

        <MeetingControls
          isVideoOn={isVideoOn}
          isAudioOn={isAudioOn}
          isRecording={isRecording}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onLeave={handleLeave}
        />
      </div>

      <div className="w-80 border-l border-gray-800 p-4">
        <NotesPanel meeting={meeting} isProcessing={isProcessing} />
      </div>
    </div>
  );
}
