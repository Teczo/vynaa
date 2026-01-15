
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
    // Dynamic import to ensure env vars are loaded BEFORE the service initializes
    const { generateTTS, askVynaa } = await import('./services/geminiService');

    console.log("Testing API Key & Text Gen...");
    try {
        const textRes = await askVynaa("Hello", "Context", false);
        console.log("Text Gen Result:", textRes.answer ? "Success" : "Empty");
    } catch (e) {
        console.error("Text Gen Failed:", e);
    }

    console.log("Testing TTS Generation...");
    console.log("API Key present:", !!process.env.GEMINI_API_KEY);

    try {
        const result = await generateTTS("Hello, this is a test.");
        if (result) {
            console.log("Success! Audio data length:", result.length);
        } else {
            console.log("Failed: Returned empty string.");
        }
    } catch (error) {
        console.error("Test Script Error:", error);
    }
}

test();
