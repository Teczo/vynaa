// List available Gemini models
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

try {
    console.log('Fetching available models...\n');
    const models = await ai.models.list();

    console.log('Available Models:');
    console.log('================');
    for (const model of models) {
        console.log(`Name: ${model.name}`);
        console.log(`Display Name: ${model.displayName || 'N/A'}`);
        console.log(`Description: ${model.description || 'N/A'}`);
        console.log('---');
    }
} catch (error) {
    console.error('Error listing models:', error.message);
}
