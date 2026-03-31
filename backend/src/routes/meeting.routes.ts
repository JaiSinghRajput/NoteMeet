import { Router } from 'express';
import {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeetingStatus,
  getMeetingByRoomId,
} from '../controllers/meeting.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.post('/', createMeeting);
router.get('/', getMeetings);
router.get('/room/:roomId', getMeetingByRoomId);
router.get('/:id', getMeeting);
router.patch('/:id/status', updateMeetingStatus);

export default router;
