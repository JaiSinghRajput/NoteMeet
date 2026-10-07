import { Router } from 'express';
import { getAgoraToken } from '../controllers/agora.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/token', getAgoraToken);

export default router;
