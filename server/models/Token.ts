import mongoose, { Schema, Document } from 'mongoose';

export interface IToken extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'email_verification' | 'password_reset';
    tokenHash: string;
    expiresAt: Date;
}

const TokenSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['email_verification', 'password_reset'], required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } } // TTL index
}, {
    timestamps: true
});

export default mongoose.model<IToken>('Token', TokenSchema);
