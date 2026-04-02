import {Router} from 'express';
import {getAdminDashboard} from '../controllers/adminController.js';
import {verifyToken} from '../middleware/auth.middleware.js';
import {requireAdmin} from '../middleware/role.middleware.js';
const router = Router();

router.get('/dashboard', verifyToken, requireAdmin, getAdminDashboard);


export default router;