import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
    ownerId: mongoose.Types.ObjectId;
    name: string;
    description?: string; // NEW
    isExpanded: boolean;
    order: number;
    settings?: { // NEW
        defaultVoice?: string;
        theme?: string;
    };
    tags?: string[]; // NEW
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' }, // NEW
    isExpanded: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    settings: { // NEW
        defaultVoice: { type: String, default: null },
        theme: { type: String, default: 'default' }
    },
    tags: [{ type: String }] // NEW
}, {
    timestamps: true
});

// Compound index for efficient ordering queries per user
ProjectSchema.index({ ownerId: 1, order: 1 });

export default mongoose.model<IProject>('Project', ProjectSchema);
