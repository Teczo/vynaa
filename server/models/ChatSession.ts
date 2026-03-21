import mongoose, { Schema, Document } from 'mongoose';

export interface IChatSession extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    createdAt: Date;
    updatedAt: Date;
}

const ChatSessionSchema = new Schema<IChatSession>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, default: 'New Canvas' },
}, { timestamps: true });

ChatSessionSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
