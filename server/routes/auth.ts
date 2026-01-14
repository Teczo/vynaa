import express from 'express';
import rateLimit from 'express-rate-limit';
import {
    signup,
    login,
    logout,
    refresh,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword
} from '../controllers/authController';

const router = express.Router();

// Rate limiter for login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per windowMs
    message: 'Too many login attempts, please try again later'
});

router.post('/signup', signup);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
