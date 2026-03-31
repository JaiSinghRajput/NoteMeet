'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { meetingApi } from '@/lib/api';
import { Meeting } from '@/types';

export default function MeetingDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/'); return; }

    meetingApi.getById(params.id).then(res => {
      setMeeting(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        Meeting not found
      </div>
    );
  }

  const date = new Date(meeting.createdAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">
          ← Back
        </button>
        <h1 className="text-xl font-bold">{meeting.title}</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>📅 {date}</span>
          <span className="bg-gray-800 px-3 py-1 rounded-full">{meeting.status}</span>
          {meeting.startedAt && meeting.endedAt && (
            <span>
              ⏱ {Math.round(
                (new Date(meeting.endedAt).getTime() - new Date(meeting.startedAt).getTime()) / 60000
              )} minutes
            </span>
          )}
        </div>

        {meeting.summary ? (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-3">✨ AI Summary</h2>
              <p className="text-gray-300 leading-relaxed">{meeting.summary.overview}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-3">📌 Key Points</h2>
                <ul className="space-y-2">
                  {meeting.summary.keyPoints.map((point, i) => (
                    <li key={i} className="text-gray-300 text-sm flex gap-2">
                      <span className="text-blue-400">•</span> {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-900 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-3">✅ Action Items</h2>
                <ul className="space-y-2">
                  {meeting.summary.actionItems.map((item, i) => (
                    <li key={i} className="text-gray-300 text-sm flex gap-2">
                      <span className="text-green-400">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-8 text-center text-gray-500">
            <p className="text-4xl mb-3">🤖</p>
            <p>No AI summary available yet. Record a meeting to generate one.</p>
          </div>
        )}

        {meeting.transcript && (
          <div className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-3">📝 Transcript</h2>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {meeting.transcript.content}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
