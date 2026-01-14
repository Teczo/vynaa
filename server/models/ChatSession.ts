import mongoose, { Schema, Document } from 'mongoose';

export interface IChatSession extends Document {
    projectId: mongoose.Types.ObjectId | null;
    ownerUserId: mongoose.Types.ObjectId;
    title: string;
    status: 'active' | 'archived' | 'deleted';
    summary?: string;
    nextTurnIndex: number;
    createdAt: Date;
    updatedAt: Date;
}

const ChatSessionSchema = new Schema<IChatSession>({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ['active', 'archived', 'deleted'],
        default: 'active',
        index: true
    },
    summary: { type: String },
    nextTurnIndex: { type: Number, default: 0 }
}, { timestamps: true });

ChatSessionSchema.index({ ownerUserId: 1, status: 1 });
ChatSessionSchema.index({ projectId: 1, createdAt: -1 });

export default mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);