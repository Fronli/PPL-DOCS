import {Router} from 'express';
import {getEvents, getEventById} from '../controllers/event.controller.js';
const router = Router();

router.get('/getEvents', getEvents);
router.get('/getEventById/:id', getEventById);


export default router;