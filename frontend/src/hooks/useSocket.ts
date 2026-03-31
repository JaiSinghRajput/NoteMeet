'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const joinRoom = useCallback((roomId: string, userId: string, name: string) => {
    socketRef.current?.emit('join-room', { roomId, userId, name });
  }, []);

  const leaveRoom = useCallback((roomId: string, userId: string) => {
    socketRef.current?.emit('leave-room', { roomId, userId });
  }, []);

  const on = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, callback);
    return () => { socketRef.current?.off(event, callback); };
  }, []);

  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { joinRoom, leaveRoom, on, emit, socket: socketRef.current };
};
