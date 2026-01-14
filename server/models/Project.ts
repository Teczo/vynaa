import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
    ownerId: mongoose.Types.ObjectId;
    name: string;
    isExpanded: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    isExpanded: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Compound index for efficient ordering queries per user
ProjectSchema.index({ ownerId: 1, order: 1 });

export default mongoose.model<IProject>('Project', ProjectSchema);
