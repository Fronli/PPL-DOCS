import {Router} from 'express';
import {verifyToken} from '../middleware/auth.middleware.js';
import {requireAdmin} from '../middleware/role.middleware.js';
import {getAdminDashboard_Apply, getAdminDashboard_EO, getAdminDashboard_User, getAdminDashboard_Events, getAdminDashboard_Transactions, deleteAccount, deactivateEvent, approveApply, rejectApply} from '../controllers/admin.controller.js';
const router = Router();

router.get('/dashboard/apply', verifyToken, requireAdmin, getAdminDashboard_Apply);
router.patch('/dashboard/apply/:id/approve', verifyToken, requireAdmin, approveApply);
router.patch('/dashboard/apply/:id/reject', verifyToken, requireAdmin, rejectApply);

router.get('/dashboard/events', verifyToken, requireAdmin, getAdminDashboard_Events);
router.get('/dashboard/accounts/eo', verifyToken, requireAdmin, getAdminDashboard_EO);
router.get('/dashboard/accounts/user', verifyToken, requireAdmin, getAdminDashboard_User);
router.get('/dashboard/transactions', verifyToken, requireAdmin, getAdminDashboard_Transactions);
router.delete('/dashboard/accounts/:id', verifyToken, requireAdmin, deleteAccount);
router.patch('/dashboard/events/:id/deactivate', verifyToken, requireAdmin, deactivateEvent);

export default router;