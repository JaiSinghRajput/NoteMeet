import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NoteMeet - AI-Powered Video Meetings',
  description: 'Record, transcribe, and summarize your meetings with AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen font-sans">{children}</body>
    </html>
  );
}
