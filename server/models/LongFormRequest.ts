import mongoose, { Schema, Document } from 'mongoose';

export interface ILongFormRequest extends Document {
    sessionId: mongoose.Types.ObjectId;
    triggerTurnId: mongoose.Types.ObjectId;
    prompt: string;
    topic: string;
    targetDurationSeconds: number;
    chunkTargetSeconds: number;
    estimatedWordsPerMinute: number;

    audienceProfile: {
        level: string;
        language: string;
    };

    styleConstraints: {
        tone: string;
        format: string;
        avoid?: string[];
        mustInclude?: string[];
    };

    modelConfig: {
        plannerModel: string;
        writerModel: string;
        temperature: number;
    };

    plan?: {
        outline: string[];
        estimatedSegments: number;
    };

    progress: {
        totalSegments: number;
        generatedSegments: number;
        currentSegmentIndex: number;
    };

    status: 'planning' | 'generating' | 'paused' | 'completed' | 'failed';

    createdAt: Date;
    updatedAt: Date;
}

const LongFormRequestSchema = new Schema<ILongFormRequest>({
    sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession', required: true, index: true },
    triggerTurnId: { type: Schema.Types.ObjectId, ref: 'Turn', required: true },
    prompt: { type: String, required: true },
    topic: { type: String, required: true },
    targetDurationSeconds: { type: Number, required: true },
    chunkTargetSeconds: { type: Number, default: 120 },
    estimatedWordsPerMinute: { type: Number, default: 150 },

    audienceProfile: {
        level: { type: String, default: 'general' },
        language: { type: String, default: 'en' }
    },

    styleConstraints: {
        tone: { type: String, default: 'informative' },
        format: { type: String, default: 'narrative' },
        avoid: [String],
        mustInclude: [String]
    },

    modelConfig: {
        plannerModel: { type: String, default: 'gemini-3-flash-preview' },
        writerModel: { type: String, default: 'gemini-2.5-flash-preview-tts' },
        temperature: { type: Number, default: 0.7 }
    },

    plan: {
        outline: [String],
        estimatedSegments: Number
    },

    progress: {
        totalSegments: { type: Number, default: 0 },
        generatedSegments: { type: Number, default: 0 },
        currentSegmentIndex: { type: Number, default: 0 }
    },

    status: {
        type: String,
        enum: ['planning', 'generating', 'paused', 'completed', 'failed'],
        default: 'planning',
        index: true
    }
}, { timestamps: true });

LongFormRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<ILongFormRequest>('LongFormRequest', LongFormRequestSchema);