import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireEO } from '../middleware/role.middleware.js';
import { getEOEvent, createEvent, getManageEventData, updateEventDetails, updateEventQuota } from '../controllers/eo.controller.js';
import { multer_upload } from '../middleware/multer.js';
const router = Router();

router.get('/getEOEvent', verifyToken, requireEO, getEOEvent);
router.get('/manageEventData/:id', verifyToken, requireEO, getManageEventData);
router.post('/createEvent', verifyToken, requireEO, multer_upload.single('poster'), createEvent);
router.put('/updateEventDetails/:id', verifyToken, requireEO, updateEventDetails);
router.put('/updateEventQuota/:id', verifyToken, requireEO, updateEventQuota);

export default router;