import express from 'express';
import rateLimit from 'express-rate-limit';
import { signup, login, logout, refresh } from '../controllers/authController';

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts, please try again later',
});

router.post('/signup', signup);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refresh);

export default router;
