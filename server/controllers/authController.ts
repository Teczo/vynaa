import { Request, Response } from 'express';
import User from '../models/User';
import Session from '../models/Session';
import generateToken from '../utils/generateToken';
import crypto from 'crypto';

// @desc    Register a new user
// @route   POST /api/auth/signup
export const signup = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

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
            // Auto-login after signup
            const accessToken = generateToken(user._id.toString());
            const refreshToken = crypto.randomBytes(40).toString('hex');

            await Session.create({
                userId: user._id,
                refreshTokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
                userAgent: req.headers['user-agent'] || 'Unknown',
                ipAddress: req.ip || 'Unknown',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/api/auth',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: accessToken,
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
            const accessToken = generateToken(user._id.toString());
            const refreshToken = crypto.randomBytes(40).toString('hex');

            await Session.create({
                userId: user._id,
                refreshTokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
                userAgent: req.headers['user-agent'] || 'Unknown',
                ipAddress: req.ip || 'Unknown',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/api/auth',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: accessToken,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Logout user
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

        session.lastActive = new Date();
        await session.save();

        const accessToken = generateToken(session.userId.toString());
        res.json({ token: accessToken });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
