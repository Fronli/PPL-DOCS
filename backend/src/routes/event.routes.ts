import {Router} from 'express';
import {getEvents, getEventById, createOrder, completePayment, getOrderTickets} from '../controllers/event.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/getEvents', getEvents);
router.get('/getEventById/:id', getEventById);
router.get('/order/:orderId/tickets', verifyToken, getOrderTickets);
router.post('/order/createOrder', verifyToken, createOrder);
router.post('/order/completePayment', verifyToken, completePayment);


export default router;