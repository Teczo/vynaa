import express from 'express';
import { generateTTS } from '../services/geminiService';

const router = express.Router();

// POST /api/tts/generate - Generate TTS for text
router.post('/generate', async (req: any, res) => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (text.length > 5000) {
            return res.status(400).json({ error: 'Text too long (max 5000 characters)' });
        }

        const audioBase64 = await generateTTS(text);

        if (!audioBase64) {
            return res.status(500).json({ error: 'Failed to generate audio' });
        }

        res.json({ audioBase64 });
    } catch (error) {
        console.error('TTS generation error:', error);
        res.status(500).json({ error: 'Failed to generate audio' });
    }
});

export default router;