import { Request, Response } from 'express';
import User from '../models/User';
import Session from '../models/Session';
import Token from '../models/Token';
import generateToken from '../utils/generateToken';
import { sendEmail, generateVerificationToken } from '../utils/sendEmail';
import crypto from 'crypto';

// @desc    Register a new user
// @route   POST /api/auth/signup
export const signup = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            passwordHash: password, // Will be hashed by pre-save hook
        });

        if (user) {
            // Create verification token
            const verificationToken = generateVerificationToken();
            const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

            await Token.create({
                userId: user._id,
                type: 'email_verification',
                tokenHash,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            });

            const verifyUrl = `${process.env.VITE_APP_URL}/verify-email?token=${verificationToken}`;
            await sendEmail({
                email: user.email,
                subject: 'Verify your email',
                message: `Please click here to verify your email: ${verifyUrl}`
            });

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                message: 'Registration successful. Please check email for verification.'
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            // Generate Access Token
            const accessToken = generateToken(user._id.toString());

            // Generate Refresh Token
            const refreshToken = crypto.randomBytes(40).toString('hex');
            const userAgent = req.headers['user-agent'] || 'Unknown';
            const ipAddress = req.ip || 'Unknown';

            // Store Session
            await Session.create({
                userId: user._id,
                refreshTokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
                userAgent,
                ipAddress,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });

            // Set Refresh Cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/api/auth',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: accessToken
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Logout user / Clear session
// @route   POST /api/auth/logout
export const logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await Session.findOneAndDelete({ refreshTokenHash: hash });
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
export const refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token' });
    }

    try {
        const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const session = await Session.findOne({ refreshTokenHash: hash });

        if (!session || session.expiresAt.getTime() < Date.now()) {
            res.clearCookie('refreshToken');
            return res.status(403).json({ message: 'Invalid or expired session' });
        }

        // Update last active
        session.lastActive = new Date();
        await session.save();

        const accessToken = generateToken(session.userId.toString());
        res.json({ token: accessToken });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify Email
// @route   POST /api/auth/verify-email
export const verifyEmail = async (req: Request, res: Response) => {
    res.status(501).json({ message: 'Not implemented' });
};

// @desc    Resend Verification Email
// @route   POST /api/auth/resend-verification
export const resendVerification = async (req: Request, res: Response) => {
    res.status(501).json({ message: 'Not implemented' });
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response) => {
    res.status(501).json({ message: 'Not implemented' });
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response) => {
    res.status(501).json({ message: 'Not implemented' });
};
