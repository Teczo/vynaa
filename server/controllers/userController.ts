import { Request, Response } from 'express';
import User from '../models/User';
import ChatSession from '../models/ChatSession';
import Turn from '../models/Turn';
import Session from '../models/Session';

interface AuthRequest extends Request {
    user?: any;
}

// @desc    Get current user profile
// @route   GET /api/user/me
export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user._id).select('-passwordHash');
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PATCH /api/user/me
export const updateMe = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Export all user data
// @route   POST /api/user/export
export const exportData = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).select('-passwordHash');
        const chatSessions = await ChatSession.find({ userId });
        const sessionIds = chatSessions.map(s => s._id);
        const turns = await Turn.find({ sessionId: { $in: sessionIds } });

        const data = {
            user,
            sessions: chatSessions,
            turns,
            timestamp: new Date(),
        };

        res.header('Content-Type', 'application/json');
        res.attachment(`vynaa-export-${userId}-${Date.now()}.json`);
        res.send(JSON.stringify(data, null, 2));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete account and all data
// @route   DELETE /api/user/me
export const deleteAccount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user._id;

        const chatSessions = await ChatSession.find({ userId });
        const sessionIds = chatSessions.map(s => s._id);
        await Turn.deleteMany({ sessionId: { $in: sessionIds } });
        await ChatSession.deleteMany({ userId });
        await Session.deleteMany({ userId });
        await User.findByIdAndDelete(userId);

        res.clearCookie('refreshToken');
        res.json({ message: 'Account and all data deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
