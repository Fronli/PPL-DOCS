import {Router} from 'express';
import {getEOdashboard} from '../controllers/eo.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireEO } from '../middleware/role.middleware.js';
const router = Router();

router.get('/dashboard', verifyToken, requireEO, getEOdashboard);


export default router;