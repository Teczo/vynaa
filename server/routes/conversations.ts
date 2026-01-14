import express from 'express';
import Conversation from '../models/Conversation';
import ConversationHistory from '../models/ConversationHistory';
import { IConversation } from '../models/Conversation';

const router = express.Router();

// GET /api/conversations - List conversations (optionally by project)
router.get('/', async (req: any, res) => {
    try {
        const userId = req.user?.id;
        const { projectId } = req.query;

        const query: any = { ownerId: userId, deletedAt: null };
        if (projectId !== undefined) {
            query.projectId = projectId === 'null' ? null : projectId;
        }

        const conversationsList = await Conversation.find(query)
            .select('_id title projectId createdAt updatedAt')
            .sort({ updatedAt: -1 });

        res.json(conversationsList);
    } catch (error) {
        console.error('Error listing conversations:', error);
        res.status(500).json({ error: 'Failed to list conversations' });
    }
});

// GET /api/conversations/:id - Load full conversation
router.get('/:id', async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const conversation = await Conversation.findOne({ _id: id, ownerId: userId, deletedAt: null });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        res.json(conversation);
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
});

// POST /api/conversations - Create new conversation
router.post('/', async (req: any, res) => {
    try {
        const userId = req.user?.id;
        const { title, projectId } = req.body;

        const conversation = new Conversation({
            ownerId: userId,
            title: title || 'New Canvas',
            projectId: projectId || null,
            nodes: []
        });

        await conversation.save();
        res.status(201).json(conversation);
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

// PATCH /api/conversations/:id - Metadata update
router.patch('/:id', async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { title, projectId, deletedAt } = req.body;

        const update: any = {};
        if (title !== undefined) update.title = title;
        if (projectId !== undefined) update.projectId = projectId;
        if (deletedAt !== undefined) update.deletedAt = deletedAt;

        const conversation = await Conversation.findOneAndUpdate(
            { _id: id, ownerId: userId },
            { $set: update },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        res.json(conversation);
    } catch (error) {
        console.error('Error updating conversation:', error);
        res.status(500).json({ error: 'Failed to update conversation' });
    }
});

// POST /api/conversations/:id/sync - Autosave / Sync
// Receives full state or patches. For now, assuming full state or partials merge.
// In a real patch system, we'd apply JSON Patches. Here we'll do field replacement for simplicity but support atomic node updates if sent.
router.post('/:id/sync', async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { nodes, viewport, version } = req.body;

        // Optimistic Locking check could go here if we enforced strict versioning
        const update: any = {
            lastSyncedAt: new Date()
        };

        if (nodes) update.nodes = nodes;
        if (viewport) update.viewport = viewport;
        if (version) update.version = version;

        const conversation = await Conversation.findOneAndUpdate(
            { _id: id, ownerId: userId },
            { $set: update },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Optional: Save history snapshot asynchronously
        // if (nodes) {
        //     await ConversationHistory.updateOne(
        //         { conversationId: id },
        //         { $push: { snapshots: { timestamp: new Date(), nodes } } },
        //         { upsert: true }
        //     );
        // }

        res.json({ success: true, lastSyncedAt: conversation.lastSyncedAt });
    } catch (error) {
        console.error('Error syncing conversation:', error);
        res.status(500).json({ error: 'Failed to sync conversation' });
    }
});

// DELETE /api/conversations/:id - Soft delete
router.delete('/:id', async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const conversation = await Conversation.findOneAndUpdate(
            { _id: id, ownerId: userId },
            { $set: { deletedAt: new Date() } },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        res.json({ message: 'Conversation moved to trash' });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});

export default router;
