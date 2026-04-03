import {Router} from 'express';
import {getLoginStaticFile, getSignupStaticFile, login, getAllUsers, register, googleLogin} from '../controllers/auth.controller.js';
const router = Router();

router.get('/login', getLoginStaticFile);
router.get('/signup', getSignupStaticFile);
router.post("/login", login);
router.post("/signup", register);
router.post("/google", googleLogin);
router.post("/getAllUsers", getAllUsers);

export default router;