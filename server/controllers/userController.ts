import { Request, Response } from 'express';
import User from '../models/User';
import Project from '../models/Project';
import Conversation from '../models/Conversation';
import Session from '../models/Session';
import Token from '../models/Token';

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

// @desc    Update user profile & preferences
// @route   PATCH /api/user/me
export const updateMe = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;

            if (req.body.preferences) {
                user.preferences = { ...user.preferences, ...req.body.preferences };
            }

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                preferences: updatedUser.preferences,
                isEmailVerified: updatedUser.isEmailVerified
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
        const projects = await Project.find({ ownerId: userId });
        const conversations = await Conversation.find({ ownerId: userId });

        const exportData = {
            user,
            projects,
            conversations,
            timestamp: new Date()
        };

        res.header('Content-Type', 'application/json');
        res.attachment(`vynaa-export-${userId}-${Date.now()}.json`);
        res.send(JSON.stringify(exportData, null, 2));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete account and all data
// @route   DELETE /api/user/me
export const deleteAccount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user._id;

        // Delete all related data
        await Project.deleteMany({ ownerId: userId });
        await Conversation.deleteMany({ ownerId: userId });
        await Session.deleteMany({ userId });
        await Token.deleteMany({ userId });
        await User.findByIdAndDelete(userId);

        res.clearCookie('refreshToken');
        res.json({ message: 'Account and all data deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
