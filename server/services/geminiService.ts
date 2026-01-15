import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '', apiVersion: 'v1beta' });

export interface VynaaResponse {
  answer: string;
  followUpQuestions: string[];
  audioIntent: boolean;
  audioBase64?: string;
}

const AUDIO_KEYWORDS = ["read", "read aloud", "explain for", "talk about", "say it", "explain verbally", "speak"];

export function detectAudioIntent(prompt: string) {
  const lower = prompt.toLowerCase();
  const hasKeyword = AUDIO_KEYWORDS.some(k => lower.includes(k));
  const durationMatch = lower.match(/(\d+)\s*min/);
  return {
    isExplicit: hasKeyword,
    duration: durationMatch ? parseInt(durationMatch[1]) : undefined
  };
}

export async function generateTTS(text: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: [{ parts: [{ text: `Read this aloud clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData?.data || "";
  } catch (error) {
    console.error("TTS Generation Error:", error);
    return "";
  }
}

export async function askVynaa(question: string, context: string = '', audioRequested: boolean = false): Promise<VynaaResponse> {
  const modelName = 'gemini-2.0-flash-exp'; // Using experimental flash model for now

  const systemInstruction = `You are Vynaa AI. 
  1. Provide a concise, insightful answer.
  2. If a duration was requested (e.g., 'for 5 minutes'), structure your answer to be detailed enough for that timeframe.
  3. Provide exactly 3 relevant follow-up questions.
  4. Return JSON.`;

  const config: any = {
    systemInstruction,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        answer: { type: Type.STRING },
        followUpQuestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
      },
      required: ["answer", "followUpQuestions"],
    },
  };

  // Audio features temporarily disabled for gemini-2.0-flash-exp compatibility
  // if (audioRequested) {
  //   config.responseModalities = [Modality.AUDIO];
  //   config.speechConfig = {
  //     voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
  //   };
  // }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: `Context: ${context}\n\nQuestion: ${question}` }] }],
      config
    });

    const data = JSON.parse(response.text || '{}');
    let audioBase64: string | undefined = undefined;

    if (audioRequested) {
      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData) {
        audioBase64 = part.inlineData.data;
      }
    }

    return {
      answer: data.answer || "I couldn't process that.",
      followUpQuestions: data.followUpQuestions || [],
      audioIntent: audioRequested,
      audioBase64
    };
  } catch (error) {
    console.error("Vynaa AI Error:", error);
    return {
      answer: "A disturbance in the knowledge field occurred.",
      followUpQuestions: ["Try again?", "What else?", "Why did that happen?"],
      audioIntent: false
    };
  }
}