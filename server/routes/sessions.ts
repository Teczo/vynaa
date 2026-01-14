import express from 'express';
import ChatSession from '../models/ChatSession';
import Turn from '../models/Turn';

const router = express.Router();

// GET /api/sessions - List sessions
router.get('/', async (req: any, res) => {
    try {
        const userId = req.user?.id;
        const { projectId, status = 'active' } = req.query;

        const query: any = { ownerUserId: userId, status };
        if (projectId !== undefined) {
            query.projectId = projectId === 'null' ? null : projectId;
        }

        const sessions = await ChatSession.find(query)
            .select('_id title projectId status summary createdAt updatedAt')
            .sort({ updatedAt: -1 });

        res.json(sessions);
    } catch (error) {
        console.error('Error listing sessions:', error);
        res.status(500).json({ error: 'Failed to list sessions' });
    }
});

// GET /api/sessions/:id - Get session with turns
router.get('/:id', async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const session = await ChatSession.findOne({
            _id: id,
            ownerUserId: userId,
            status: { $ne: 'deleted' }
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const turns = await Turn.find({ sessionId: id })
            .sort({ turnIndex: 1 });

        res.json({ session, turns });
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({ error: 'Failed to fetch session' });
    }
});

// POST /api/sessions - Create new session
router.post('/', async (req: any, res) => {
    try {
        const userId = req.user?.id;
        const { title, projectId } = req.body;

        const session = await ChatSession.create({
            ownerUserId: userId,
            projectId: projectId || null,
            title: title || 'New Canvas',
            status: 'active',
            nextTurnIndex: 0
        });

        res.status(201).json(session);
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// PATCH /api/sessions/:id - Update session metadata
router.patch('/:id', async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { title, status, summary, projectId } = req.body;

        const update: any = {};
        if (title !== undefined) update.title = title;
        if (status !== undefined) update.status = status;
        if (summary !== undefined) update.summary = summary;
        if (projectId !== undefined) update.projectId = projectId;

        const session = await ChatSession.findOneAndUpdate(
            { _id: id, ownerUserId: userId },
            { $set: update },
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

// DELETE /api/sessions/:id - Soft delete
router.delete('/:id', async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const session = await ChatSession.findOneAndUpdate(
            { _id: id, ownerUserId: userId },
            { $set: { status: 'deleted' } },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ message: 'Session deleted' });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

export default router;