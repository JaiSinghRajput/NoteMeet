import { Router } from 'express';
import multer from 'multer';
import { uploadAudio, getTranscript, getSummary } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/webm', 'audio/wav', 'audio/mp4', 'audio/mpeg', 'audio/ogg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

const router = Router();

router.use(authenticate);
router.post('/upload', upload.single('audio'), uploadAudio);
router.get('/transcript/:meetingId', getTranscript);
router.get('/summary/:meetingId', getSummary);

export default router;
