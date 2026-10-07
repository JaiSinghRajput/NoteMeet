import { Request, Response } from 'express';
import { generateAgoraToken } from '../services/agora.service';

export const getAgoraToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelName, uid } = req.query;

    if (!channelName || !uid) {
      res.status(400).json({ error: 'channelName and uid are required' });
      return;
    }

    // Role 1 = Publisher, 2 = Subscriber. Default to Publisher for meeting room users
    const token = await generateAgoraToken(String(channelName), String(uid), 1);
    res.json({ token });
  } catch (error) {
    console.error('Failed to generate Agora token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
};
