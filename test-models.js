// Test valid model with current API key
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const modelsToTest = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'];

for (const modelName of modelsToTest) {
    try {
        console.log(`\nTesting ${modelName}...`);
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: 'Say hello' }] }]
        });

        console.log(`✅ ${modelName} WORKS!`);
        console.log('Response:', response.text);
    } catch (error) {
        console.log(`❌ ${modelName} FAILED:`);
        console.error('  Error:', error.message);
    }
}
