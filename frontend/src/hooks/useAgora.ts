'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalVideoTrack,
  ILocalAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
} from 'agora-rtc-sdk-ng';

export interface RemoteUser {
  uid: string | number;
  videoTrack?: IRemoteVideoTrack;
  audioTrack?: IRemoteAudioTrack;
}

// Convert a UUID or string to a stable numeric UID (must match backend)
const stringToNumericUid = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Ensure positive 32-bit unsigned integer
  return Math.abs(hash) % 0xFFFFFFFF;
};

export const useAgora = (appId: string) => {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const joiningRef = useRef(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = useCallback(async (channelName: string, token: string | null, uid: string) => {
    if (joiningRef.current || joined) {
      return;
    }

    if (!appId) {
      setError('Agora App ID is not configured');
      return;
    }

    if (!token) {
      setError('Agora token is missing');
      return;
    }

    joiningRef.current = true;

    try {
      // Convert UID to numeric using same hash as backend
      const numericUid = stringToNumericUid(uid);

      if (clientRef.current) {
        try {
          clientRef.current.removeAllListeners();
          await clientRef.current.leave();
        } catch {
          // no-op
        }
      }
      
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
          setRemoteUsers(prev => {
            const existing = prev.find(u => u.uid === user.uid);
            if (existing) {
              return prev.map(u => u.uid === user.uid ? { ...u, videoTrack: user.videoTrack } : u);
            }
            return [...prev, { uid: user.uid, videoTrack: user.videoTrack }];
          });
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
          setRemoteUsers(prev => {
            const existing = prev.find(u => u.uid === user.uid);
            if (existing) {
              return prev.map(u => u.uid === user.uid ? { ...u, audioTrack: user.audioTrack } : u);
            }
            return [...prev, { uid: user.uid, audioTrack: user.audioTrack }];
          });
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, videoTrack: undefined } : u));
        }
        if (mediaType === 'audio') {
          setRemoteUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, audioTrack: undefined } : u));
        }
      });

      client.on('user-left', (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      // Join the channel with numeric UID (must match token generation)
      await client.join(appId, channelName, token, numericUid);

      try {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        await client.publish([audioTrack, videoTrack]);
      } catch (trackError: unknown) {
        const err = trackError as any;
        console.warn('Failed to create or publish tracks:', err);
        // Continue even if track creation fails - user can still hear/see others
        if (err.message?.includes('Permission')) {
          setError('Microphone/Camera permission denied. You can still view the meeting.');
        } else {
          setError('Failed to access microphone/camera. You can still view the meeting.');
        }
      }

      setJoined(true);
      setError(null);
    } catch (joinError: unknown) {
      const err = joinError as any;
      console.error('Failed to join Agora channel:', err);
      const errorMsg = err?.message || 'Failed to join meeting';
      setError(errorMsg);
      setJoined(false);
      if (clientRef.current) {
        try {
          clientRef.current.removeAllListeners();
          await clientRef.current.leave();
        } catch {
          // no-op
        }
      }
    } finally {
      joiningRef.current = false;
    }
  }, [appId, joined]);

  const leave = useCallback(async () => {
    joiningRef.current = false;
    localVideoTrack?.stop();
    localVideoTrack?.close();
    localAudioTrack?.stop();
    localAudioTrack?.close();
    clientRef.current?.removeAllListeners();
    await clientRef.current?.leave();
    setJoined(false);
    setLocalVideoTrack(null);
    setLocalAudioTrack(null);
    setRemoteUsers([]);
    setError(null);
  }, [localVideoTrack, localAudioTrack]);

  const toggleVideo = useCallback(async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoOn);
      setIsVideoOn(prev => !prev);
    }
  }, [localVideoTrack, isVideoOn]);

  const toggleAudio = useCallback(async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioOn);
      setIsAudioOn(prev => !prev);
    }
  }, [localAudioTrack, isAudioOn]);

  const localVideoTrackRef = useRef<ILocalVideoTrack | null>(null);
  const localAudioTrackRef = useRef<ILocalAudioTrack | null>(null);

  // Keep refs in sync with state so cleanup can access latest tracks
  useEffect(() => { localVideoTrackRef.current = localVideoTrack; }, [localVideoTrack]);
  useEffect(() => { localAudioTrackRef.current = localAudioTrack; }, [localAudioTrack]);

  useEffect(() => {
    return () => {
      localVideoTrackRef.current?.stop();
      localVideoTrackRef.current?.close();
      localAudioTrackRef.current?.stop();
      localAudioTrackRef.current?.close();
      clientRef.current?.leave().catch(() => {});
    };
  }, []);

  return {
    join,
    leave,
    toggleVideo,
    toggleAudio,
    localVideoTrack,
    localAudioTrack,
    remoteUsers,
    isVideoOn,
    isAudioOn,
    joined,
    error,
    client: clientRef.current,
  };
};
