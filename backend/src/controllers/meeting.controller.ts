import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const createMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const meeting = await prisma.meeting.create({
      data: {
        title,
        roomId: uuidv4(),
        hostId: req.userId as string,
        status: 'SCHEDULED',
      },
      include: { host: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMeetings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meetings = await prisma.meeting.findMany({
      where: { hostId: req.userId },
      include: {
        host: { select: { id: true, name: true } },
        transcript: true,
        summary: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, name: true } },
        transcript: true,
        summary: true,
      },
    });

    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMeetingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        status,
        ...(status === 'ACTIVE' && { startedAt: new Date() }),
        ...(status === 'ENDED' && { endedAt: new Date() }),
      },
    });

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMeetingByRoomId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const meeting = await prisma.meeting.findUnique({
      where: { roomId },
      include: {
        host: { select: { id: true, name: true } },
        transcript: true,
        summary: true,
      },
    });

    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
