import { askVynaa, detectAudioIntent } from './geminiService';
import Turn from '../models/Turn';

export async function generateAIResponse(sessionId: string, userQuestion: string) {
    try {
        // Get recent context (last 6 turns)
        const recentTurns = await Turn.find({ sessionId })
            .sort({ turnIndex: -1 })
            .limit(6);

        const context = recentTurns
            .reverse()
            .map(t => t.content)
            .join('\n');

        const { isExplicit, duration } = detectAudioIntent(userQuestion);

        const result = await askVynaa(userQuestion, context, isExplicit);

        return {
            answer: result.answer,
            suggestions: result.followUpQuestions.map((text, i) => ({
                id: `sug-${Date.now()}-${i}`,
                text
            })),
            audio: result.audioBase64 ? {
                hasAudio: true,
                base64Data: result.audioBase64,
                durationRequested: duration
            } : undefined
        };
    } catch (error) {
        console.error('AI Response Generation Error:', error);
        throw error;
    }
}