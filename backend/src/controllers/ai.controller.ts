import { Response } from 'express';
import prisma from '../utils/prisma';
import { transcribeAudio, generateSummary } from '../services/ai.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const uploadAudio = async (req: AuthRequest & { file?: Express.Multer.File }, res: Response): Promise<void> => {
  try {
    const { meetingId } = req.body;
    if (!meetingId || !req.file) {
      res.status(400).json({ error: 'meetingId and audio file are required' });
      return;
    }

    await prisma.meeting.update({
      where: { id: meetingId },
      data: { audioPath: req.file.path },
    });

    processAI(meetingId, req.file.path);

    res.json({ message: 'Audio uploaded. Processing started.', meetingId });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTranscript = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const transcript = await prisma.transcript.findUnique({ where: { meetingId } });
    if (!transcript) {
      res.status(404).json({ error: 'Transcript not found or still processing' });
      return;
    }
    res.json(transcript);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const summary = await prisma.summary.findUnique({ where: { meetingId } });
    if (!summary) {
      res.status(404).json({ error: 'Summary not found or still processing' });
      return;
    }
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

async function processAI(meetingId: string, audioPath: string) {
  try {
    const transcriptText = await transcribeAudio(audioPath);

    await prisma.transcript.create({
      data: { meetingId, content: transcriptText },
    });

    const summaryData = await generateSummary(transcriptText);

    await prisma.summary.create({
      data: {
        meetingId,
        overview: summaryData.overview,
        keyPoints: summaryData.keyPoints,
        actionItems: summaryData.actionItems,
      },
    });

    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'ENDED' },
    });
  } catch (error) {
    console.error('AI processing error:', error);
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'ENDED' },
    }).catch(err => console.error('Failed to update meeting status after AI error:', err));
  }
}
