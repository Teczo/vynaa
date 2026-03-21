import express from 'express';
import ChatSession from '../models/ChatSession';
import Turn from '../models/Turn';
import { streamAIResponse } from '../services/aiService';

const router = express.Router();

// POST /api/sessions/:sessionId/turns - Create user turn + stream AI response
router.post('/:sessionId/turns', async (req: any, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.id;
        const { content, parentTurnId, position, provider, model, apiKey } = req.body;

        if (!content || typeof content !== 'string') {
            return res.status(400).json({ error: 'Content is required' });
        }

        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required. Configure it in Settings.' });
        }

        if (!provider || !model) {
            return res.status(400).json({ error: 'Provider and model are required' });
        }

        const session = await ChatSession.findOne({ _id: sessionId, userId });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Create user turn
        const userTurn = await Turn.create({
            sessionId,
            parentTurnId: parentTurnId || null,
            role: 'user',
            content,
            aiModel: '',
            provider,
            position: position || { x: 0, y: 0 },
        });

        // Auto-title from first message
        const turnCount = await Turn.countDocuments({ sessionId });
        if (turnCount === 1 && session.title === 'New Canvas') {
            session.title = content.length > 50 ? content.substring(0, 50) + '...' : content;
            await session.save();
        }

        // Build conversation history by following parentTurnId chain
        const history = await buildConversationHistory(userTurn._id.toString(), sessionId);

        // Stream AI response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let fullResponse = '';

        try {
            await streamAIResponse({
                provider,
                model,
                apiKey,
                messages: history,
                onToken: (token: string) => {
                    fullResponse += token;
                    res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
                },
            });
        } catch (aiError: any) {
            res.write(`data: ${JSON.stringify({ type: 'error', content: aiError.message || 'AI call failed' })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
            return;
        }

        // Save assistant turn
        const aiPosition = position
            ? { x: position.x + (Math.random() - 0.5) * 150, y: position.y + 300 }
            : { x: 0, y: 300 };

        const assistantTurn = await Turn.create({
            sessionId,
            parentTurnId: userTurn._id,
            role: 'assistant',
            content: fullResponse,
            aiModel: model,
            provider,
            position: aiPosition,
        });

        // Send final message with turn data
        res.write(`data: ${JSON.stringify({
            type: 'done',
            userTurn,
            assistantTurn,
            sessionTitle: session.title,
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error('Error creating turn:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to create turn' });
        } else {
            res.write(`data: ${JSON.stringify({ type: 'error', content: 'Server error' })}\n\n`);
            res.end();
        }
    }
});

// GET /api/sessions/:sessionId/turns - Get all turns
router.get('/:sessionId/turns', async (req: any, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.id;

        const session = await ChatSession.findOne({ _id: sessionId, userId });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const turns = await Turn.find({ sessionId }).sort({ createdAt: 1 });
        res.json(turns);
    } catch (error) {
        console.error('Error fetching turns:', error);
        res.status(500).json({ error: 'Failed to fetch turns' });
    }
});

// PATCH /api/sessions/:sessionId/turns/:turnId/position - Update turn position
router.patch('/:sessionId/turns/:turnId/position', async (req: any, res) => {
    try {
        const { sessionId, turnId } = req.params;
        const userId = req.user?.id;
        const { position } = req.body;

        if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
            return res.status(400).json({ error: 'Invalid position format' });
        }

        const session = await ChatSession.findOne({ _id: sessionId, userId });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const turn = await Turn.findOneAndUpdate(
            { _id: turnId, sessionId },
            { $set: { position } },
            { new: true }
        );

        if (!turn) {
            return res.status(404).json({ error: 'Turn not found' });
        }

        res.json(turn);
    } catch (error) {
        console.error('Error updating turn position:', error);
        res.status(500).json({ error: 'Failed to update turn position' });
    }
});

/**
 * Build conversation history by following the parentTurnId chain
 * from the given turn back to the root.
 */
async function buildConversationHistory(turnId: string, sessionId: string) {
    const chain: Array<{ role: string; content: string }> = [];
    let currentId: string | null = turnId;

    // Follow the chain up to root (max 50 turns to prevent infinite loops)
    const turns: any[] = [];
    for (let i = 0; i < 50 && currentId; i++) {
        const turn = await Turn.findOne({ _id: currentId, sessionId });
        if (!turn) break;
        turns.unshift(turn);
        currentId = turn.parentTurnId?.toString() || null;
    }

    for (const turn of turns) {
        chain.push({
            role: turn.role === 'assistant' ? 'assistant' : 'user',
            content: turn.content,
        });
    }

    return chain;
}

export default router;
