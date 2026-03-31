'use client';
import Link from 'next/link';
import { Meeting } from '@/types';

interface Props {
  meeting: Meeting;
}

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-yellow-500/20 text-yellow-400',
  ACTIVE: 'bg-green-500/20 text-green-400',
  ENDED: 'bg-gray-500/20 text-gray-400',
};

export default function MeetingCard({ meeting }: Props) {
  const date = new Date(meeting.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const duration =
    meeting.startedAt && meeting.endedAt
      ? Math.round(
          (new Date(meeting.endedAt).getTime() - new Date(meeting.startedAt).getTime()) / 60000
        )
      : null;

  return (
    <div className="bg-gray-800 rounded-xl p-5 hover:bg-gray-750 transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold text-base">{meeting.title}</h3>
          <p className="text-gray-400 text-sm mt-1">{date}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[meeting.status]}`}>
          {meeting.status}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
        {duration !== null && <span>⏱ {duration} min</span>}
        {meeting.transcript && <span>📝 Transcript</span>}
        {meeting.summary && <span>✨ Summary</span>}
      </div>

      <div className="flex gap-2">
        {meeting.status !== 'ENDED' && (
          <Link
            href={`/meeting/${meeting.roomId}`}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 px-4 rounded-lg text-center transition"
          >
            Join Meeting
          </Link>
        )}
        <Link
          href={`/dashboard/meeting/${meeting.id}`}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded-lg text-center transition"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
