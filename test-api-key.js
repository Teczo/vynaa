// Quick test script to verify Gemini API key
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;

console.log('Testing Gemini API Key...');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

try {
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ parts: [{ text: 'Say hello' }] }]
    });

    console.log('✅ API Key is VALID!');
    console.log('Response:', response.text);
} catch (error) {
    console.log('❌ API Key ERROR:');
    console.error(error.message);
    console.error('Full error:', error);
}
