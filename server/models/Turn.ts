import mongoose, { Schema, Document } from 'mongoose';

export interface ITurn extends Document {
    sessionId: mongoose.Types.ObjectId;
    parentTurnId: mongoose.Types.ObjectId | null;
    role: 'user' | 'assistant';
    content: string;
    aiModel: string;
    provider: 'google' | 'openai' | 'anthropic';
    position: { x: number; y: number };
    suggestions?: Array<{ id: string; text: string }>;
    createdAt: Date;
}

const TurnSchema = new Schema<ITurn>({
    sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession', required: true, index: true },
    parentTurnId: { type: Schema.Types.ObjectId, ref: 'Turn', default: null },
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: { type: String, required: true },
    aiModel: { type: String, default: '' },
    provider: {
        type: String,
        enum: ['google', 'openai', 'anthropic'],
        default: 'google'
    },
    position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 }
    },
    suggestions: [{
        id: String,
        text: String
    }]
}, { timestamps: true });

TurnSchema.index({ sessionId: 1, createdAt: 1 });

export default mongoose.model<ITurn>('Turn', TurnSchema);
