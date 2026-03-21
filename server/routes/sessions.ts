import express from 'express';
import ChatSession from '../models/ChatSession';
import Turn from '../models/Turn';

const router = express.Router();

// GET /api/sessions - List sessions for authenticated user
router.get('/', async (req: any, res) => {
    try {
        const userId = req.user?.id;

        const sessionsList = await ChatSession.find({ userId })
            .select('_id title createdAt updatedAt')
            .sort({ updatedAt: -1 });

        res.json(sessionsList);
    } catch (error) {
        console.error('Error listing sessions:', error);
        res.status(500).json({ error: 'Failed to list sessions' });
    }
});

// GET /api/sessions/:id - Get session with ALL its turns
router.get('/:id', async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const session = await ChatSession.findOne({ _id: id, userId });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const turns = await Turn.find({ sessionId: id }).sort({ createdAt: 1 });

        res.json({ session, turns });
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({ error: 'Failed to fetch session' });
    }
});

// POST /api/sessions - Create new empty session
router.post('/', async (req: any, res) => {
    try {
        const userId = req.user?.id;
        const { title } = req.body;

        const session = await ChatSession.create({
            userId,
            title: title || 'New Canvas',
        });

        res.status(201).json(session);
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// PATCH /api/sessions/:id - Update session title
router.patch('/:id', async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { title } = req.body;

        const session = await ChatSession.findOneAndUpdate(
            { _id: id, userId },
            { $set: { title } },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json(session);
    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({ error: 'Failed to update session' });
    }
});

// DELETE /api/sessions/:id - Delete session and all its turns
router.delete('/:id', async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const session = await ChatSession.findOneAndDelete({ _id: id, userId });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        await Turn.deleteMany({ sessionId: id });

        res.json({ message: 'Session deleted' });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

export default router;
