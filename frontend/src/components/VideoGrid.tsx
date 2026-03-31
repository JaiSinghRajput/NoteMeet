'use client';
import { useEffect, useRef } from 'react';
import { ILocalVideoTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng';
import { RemoteUser } from '@/hooks/useAgora';

interface Props {
  localVideoTrack: ILocalVideoTrack | null;
  remoteUsers: RemoteUser[];
  isVideoOn: boolean;
  userName: string;
}

function VideoBox({
  track,
  label,
  isOff,
}: {
  track: ILocalVideoTrack | IRemoteVideoTrack | undefined | null;
  label: string;
  isOff?: boolean;
}) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (track && divRef.current && !isOff) {
      track.play(divRef.current);
    }
    return () => {
      track?.stop();
    };
  }, [track, isOff]);

  return (
    <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video">
      {isOff || !track ? (
        <div className="flex items-center justify-center h-full w-full">
          <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center">
            <span className="text-2xl text-white">{label[0]?.toUpperCase()}</span>
          </div>
        </div>
      ) : (
        <div ref={divRef} className="w-full h-full" />
      )}
      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
        {label}
      </div>
    </div>
  );
}

export default function VideoGrid({ localVideoTrack, remoteUsers, isVideoOn, userName }: Props) {
  const count = 1 + remoteUsers.length;
  const gridClass = count === 1 ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <div className={`grid ${gridClass} gap-4 w-full`}>
      <VideoBox
        track={localVideoTrack}
        label={`${userName} (You)`}
        isOff={!isVideoOn}
      />
      {remoteUsers.map(user => (
        <VideoBox
          key={user.uid}
          track={user.videoTrack}
          label={`User ${user.uid}`}
          isOff={!user.videoTrack}
        />
      ))}
    </div>
  );
}
