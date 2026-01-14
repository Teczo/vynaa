import express from 'express';
import ChatSession from '../models/ChatSession';
import Turn from '../models/Turn';
import { generateAIResponse } from '../services/aiService';

const router = express.Router();

// POST /api/sessions/:sessionId/turns - Add new turn and get AI response
router.post('/:sessionId/turns', async (req: any, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.id;
        const { content, position } = req.body;

        // Verify session ownership
        const session = await ChatSession.findOne({
            _id: sessionId,
            ownerUserId: userId,
            status: 'active'
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Atomically allocate turnIndex for user turn
        const userTurnIndex = session.nextTurnIndex;
        session.nextTurnIndex += 1;
        await session.save();

        // Create user turn
        const userTurn = await Turn.create({
            sessionId,
            projectId: session.projectId,
            turnIndex: userTurnIndex,
            role: 'user',
            content,
            metadata: {
                position: position || { x: 0, y: 0 },
                velocity: { x: 0, y: 0 }
            }
        });

        // Generate AI response
        const aiResponse = await generateAIResponse(sessionId, content);

        // Allocate turnIndex for assistant turn
        const assistantTurnIndex = session.nextTurnIndex;
        session.nextTurnIndex += 1;

        // Update title if it's the first turn
        if (userTurnIndex === 0 && session.title === 'New Canvas') {
            session.title = content.length > 50 ? content.substring(0, 50) + '...' : content;
        }

        await session.save();

        // Create assistant turn
        const assistantTurn = await Turn.create({
            sessionId,
            projectId: session.projectId,
            turnIndex: assistantTurnIndex,
            role: 'assistant',
            content: aiResponse.answer,
            metadata: {
                suggestions: aiResponse.suggestions,
                audio: aiResponse.audio,
                position: position ? {
                    x: position.x + (Math.random() - 0.5) * 150,
                    y: position.y + 300
                } : { x: 0, y: 300 },
                velocity: { x: 0, y: 0 }
            }
        });

        res.status(201).json({
            userTurn,
            assistantTurn
        });
    } catch (error) {
        console.error('Error creating turn:', error);
        res.status(500).json({ error: 'Failed to create turn' });
    }
});

// GET /api/sessions/:sessionId/turns - Get all turns
router.get('/:sessionId/turns', async (req: any, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.id;

        // Verify ownership
        const session = await ChatSession.findOne({
            _id: sessionId,
            ownerUserId: userId
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const turns = await Turn.find({ sessionId })
            .sort({ turnIndex: 1 });

        res.json(turns);
    } catch (error) {
        console.error('Error fetching turns:', error);
        res.status(500).json({ error: 'Failed to fetch turns' });
    }
});

export default router;