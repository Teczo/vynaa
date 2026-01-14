import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationHistory extends Document {
    conversationId: mongoose.Types.ObjectId;
    snapshots: any[];
    createdAt: Date;
    updatedAt: Date;
}

const ConversationHistorySchema: Schema = new Schema({
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    snapshots: [{ type: Schema.Types.Mixed }] // Store generic snapshots or patches
}, {
    timestamps: true
});

export default mongoose.model<IConversationHistory>('ConversationHistory', ConversationHistorySchema);
