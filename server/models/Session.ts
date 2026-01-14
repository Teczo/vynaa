import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
    userId: mongoose.Types.ObjectId;
    refreshTokenHash: string;
    userAgent: string;
    ipAddress: string;
    lastActive: Date;
    expiresAt: Date;
    isValid: boolean;
}

const SessionSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    lastActive: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index
    isValid: { type: Boolean, default: true }
}, {
    timestamps: true
});

export default mongoose.model<ISession>('Session', SessionSchema);
