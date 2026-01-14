import mongoose, { Schema, Document } from 'mongoose';

export interface ITurn extends Document {
    sessionId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId | null;
    turnIndex: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata: {
        suggestions?: Array<{ id: string; text: string }>;
        audio?: {
            hasAudio: boolean;
            base64Data?: string;
            durationRequested?: number;
        };
        position?: { x: number; y: number };
        velocity?: { x: number; y: number };
    };
    createdAt: Date;
}

const TurnSchema = new Schema<ITurn>({
    sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    turnIndex: { type: Number, required: true },
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: { type: String, required: true },
    metadata: {
        suggestions: [{
            id: String,
            text: String
        }],
        audio: {
            hasAudio: Boolean,
            base64Data: String,
            durationRequested: Number
        },
        position: { x: Number, y: Number },
        velocity: { x: Number, y: Number }
    }
}, { timestamps: true });

TurnSchema.index({ sessionId: 1, turnIndex: 1 }, { unique: true });

export default mongoose.model<ITurn>('Turn', TurnSchema);