import { RtcTokenBuilder } from 'agora-token';

// Convert a UUID or string to a stable numeric UID
const stringToNumericUid = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Ensure positive 32-bit unsigned integer
  return Math.abs(hash) % 0xFFFFFFFF;
};

export const generateAgoraToken = async (
  channelName: string,
  uid: string | number,
  role: number = 1 // 1 = Publisher, 2 = Subscriber
): Promise<string> => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    throw new Error('Agora credentials not configured. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE in .env');
  }

  // Convert UID to numeric - handle both string and number inputs
  const numericUid = typeof uid === 'number' ? uid : stringToNumericUid(String(uid));

  // Token expires in 1 hour
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    numericUid,
    role,
    privilegeExpiredTs,
    privilegeExpiredTs
  );

  return token;
};
