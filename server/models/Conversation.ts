import mongoose, { Schema, Document } from 'mongoose';

const SuggestionSchema = new Schema({
    id: String,
    text: String
}, { _id: false });

const AudioStateSchema = new Schema({
    hasAudio: Boolean,
    autoPlay: Boolean,
    isPlaying: Boolean,
    base64Data: String, // Note: For production with large files, move to S3/GridFS
    durationRequested: Number
}, { _id: false });

const NodeDataSchema = new Schema({
    id: { type: String, required: true }, // Client-side ID mainly
    parentId: { type: String, default: null },
    type: { type: String, enum: ['root', 'ai', 'user'], required: true },
    content: { type: String, default: '' },
    suggestions: [SuggestionSchema],
    position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 }
    },
    velocity: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 }
    },
    audio: AudioStateSchema,
    timestamp: { type: Number, default: Date.now },
    isDragging: Boolean
}, { _id: false });

const ViewportSchema = new Schema({
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    zoom: { type: Number, default: 1 }
}, { _id: false });

export interface IConversation extends Document {
    ownerId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId | null;
    title: string;
    nodes: any[];
    viewport: { x: number; y: number; zoom: number };
    version: number;
    lastSyncedAt: Date;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema: Schema = new Schema({
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    title: { type: String, required: true, trim: true },
    nodes: [NodeDataSchema],
    viewport: { type: ViewportSchema, default: () => ({ x: 0, y: 0, zoom: 1 }) },
    version: { type: Number, default: 1 },
    lastSyncedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null, index: true }
}, {
    timestamps: true
});

// Text index for search
ConversationSchema.index({ title: 'text', 'nodes.content': 'text' });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
