export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Meeting {
  id: string;
  title: string;
  roomId: string;
  hostId: string;
  host: { id: string; name: string };
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED';
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  audioPath: string | null;
  transcript: Transcript | null;
  summary: Summary | null;
}

export interface Transcript {
  id: string;
  meetingId: string;
  content: string;
  createdAt: string;
}

export interface Summary {
  id: string;
  meetingId: string;
  overview: string;
  keyPoints: string[];
  actionItems: string[];
  createdAt: string;
}
