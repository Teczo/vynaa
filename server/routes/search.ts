import express from 'express';
import Project from '../models/Project';
import Conversation from '../models/Conversation';

const router = express.Router();

// GET /api/search?q=query
router.get('/', async (req: any, res) => {
    try {
        const userId = req.user?.id;
        const { q } = req.query;

        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Search query required' });
        }

        // Parallel Search
        const [projects, conversations] = await Promise.all([
            Project.find(
                {
                    ownerId: userId,
                    $text: { $search: q }
                },
                { score: { $meta: "textScore" } }
            ).sort({ score: { $meta: "textScore" } }).limit(5),

            Conversation.find(
                {
                    ownerId: userId,
                    deletedAt: null,
                    $text: { $search: q }
                },
                { score: { $meta: "textScore" } }
            ).sort({ score: { $meta: "textScore" } }).limit(10)
        ]);

        res.json({
            projects,
            conversations
        });
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

export default router;
