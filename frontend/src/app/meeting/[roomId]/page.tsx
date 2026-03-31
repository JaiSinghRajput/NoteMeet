'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MeetingRoom from '@/components/MeetingRoom';
import { User } from '@/types';

export default function MeetingPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <MeetingRoom
      roomId={roomId}
      userId={user.id}
      userName={user.name}
    />
  );
}
