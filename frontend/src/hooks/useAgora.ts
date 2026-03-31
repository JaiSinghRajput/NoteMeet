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

export const useAgora = (appId: string) => {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [joined, setJoined] = useState(false);

  const join = useCallback(async (channelName: string, token: string | null, uid: string) => {
    if (!appId) return;

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

    await client.join(appId, channelName, token, uid);

    const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
    setLocalAudioTrack(audioTrack);
    setLocalVideoTrack(videoTrack);

    await client.publish([audioTrack, videoTrack]);
    setJoined(true);
  }, [appId]);

  const leave = useCallback(async () => {
    localVideoTrack?.stop();
    localVideoTrack?.close();
    localAudioTrack?.stop();
    localAudioTrack?.close();
    await clientRef.current?.leave();
    setJoined(false);
    setLocalVideoTrack(null);
    setLocalAudioTrack(null);
    setRemoteUsers([]);
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
    client: clientRef.current,
  };
};
