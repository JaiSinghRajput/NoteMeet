'use client';
import { Meeting } from '@/types';

interface Props {
  meeting: Meeting | null;
  isProcessing: boolean;
}

export default function NotesPanel({ meeting, isProcessing }: Props) {
  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl p-4 overflow-y-auto">
      <h2 className="text-white font-semibold text-lg mb-4">📝 Meeting Notes</h2>

      {isProcessing && (
        <div className="flex items-center gap-2 text-blue-400 mb-4">
          <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
          <span className="text-sm">Processing AI summary...</span>
        </div>
      )}

      {meeting?.summary ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">Overview</h3>
            <p className="text-white text-sm leading-relaxed">{meeting.summary.overview}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">Key Points</h3>
            <ul className="space-y-1">
              {meeting.summary.keyPoints.map((point, i) => (
                <li key={i} className="text-white text-sm flex gap-2">
                  <span className="text-blue-400">•</span> {point}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">Action Items</h3>
            <ul className="space-y-1">
              {meeting.summary.actionItems.map((item, i) => (
                <li key={i} className="text-white text-sm flex gap-2">
                  <span className="text-green-400">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-sm text-center mt-8">
          {isProcessing
            ? 'AI is analyzing your meeting...'
            : 'Notes will appear here after recording is processed.'}
        </div>
      )}

      {meeting?.transcript && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">Transcript</h3>
          <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">
            {meeting.transcript.content}
          </p>
        </div>
      )}
    </div>
  );
}
