'use client';

interface Props {
  isVideoOn: boolean;
  isAudioOn: boolean;
  isRecording: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onLeave: () => void;
}

export default function MeetingControls({
  isVideoOn,
  isAudioOn,
  isRecording,
  onToggleVideo,
  onToggleAudio,
  onStartRecording,
  onStopRecording,
  onLeave,
}: Props) {
  return (
    <div className="flex items-center justify-center gap-4 py-4 bg-gray-900 rounded-xl px-6">
      <button
        onClick={onToggleVideo}
        className={`p-3 rounded-full text-white font-medium transition ${
          isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'
        }`}
        title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
      >
        {isVideoOn ? '📹' : '🚫'}
      </button>

      <button
        onClick={onToggleAudio}
        className={`p-3 rounded-full text-white font-medium transition ${
          isAudioOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'
        }`}
        title={isAudioOn ? 'Mute' : 'Unmute'}
      >
        {isAudioOn ? '🎙️' : '🔇'}
      </button>

      <button
        onClick={isRecording ? onStopRecording : onStartRecording}
        className={`px-4 py-3 rounded-full text-white font-medium transition ${
          isRecording
            ? 'bg-red-600 hover:bg-red-500 animate-pulse'
            : 'bg-green-600 hover:bg-green-500'
        }`}
      >
        {isRecording ? '⏹ Stop Recording' : '⏺ Start Recording'}
      </button>

      <button
        onClick={onLeave}
        className="px-4 py-3 rounded-full bg-red-700 hover:bg-red-600 text-white font-medium transition"
      >
        📴 Leave
      </button>
    </div>
  );
}
