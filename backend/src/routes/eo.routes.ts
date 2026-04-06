import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireEO } from '../middleware/role.middleware.js';
import { getEOEvent, createEvent } from '../controllers/eo.controller.js';
import { multer_upload } from '../middleware/multer.js';
const router = Router();

router.get('/getEOEvent', verifyToken, requireEO, getEOEvent);
router.post('/createEvent', verifyToken, requireEO, multer_upload.single('poster'), createEvent);

export default router;