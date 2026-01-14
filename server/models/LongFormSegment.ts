import mongoose, { Schema, Document } from 'mongoose';

export interface ILongFormSegment extends Document {
    longFormRequestId: mongoose.Types.ObjectId;
    segmentIndex: number;
    title: string;
    text: string;
    wordCount: number;
    secondsEstimated: number;

    continuity: {
        tail: string; // Last ~300 words
        summaryBullets: string[];
        keyTermsIntroduced: string[];
    };

    tts?: {
        base64Audio?: string;
        durationActual?: number;
        voiceName?: string;
    };

    status: 'pending' | 'generating' | 'completed' | 'regenerated';

    createdAt: Date;
}

const LongFormSegmentSchema = new Schema<ILongFormSegment>({
    longFormRequestId: {
        type: Schema.Types.ObjectId,
        ref: 'LongFormRequest',
        required: true,
        index: true
    },
    segmentIndex: { type: Number, required: true },
    title: { type: String, required: true },
    text: { type: String, required: true },
    wordCount: { type: Number, required: true },
    secondsEstimated: { type: Number, required: true },

    continuity: {
        tail: { type: String, required: true },
        summaryBullets: [String],
        keyTermsIntroduced: [String]
    },

    tts: {
        base64Audio: String,
        durationActual: Number,
        voiceName: String
    },

    status: {
        type: String,
        enum: ['pending', 'generating', 'completed', 'regenerated'],
        default: 'pending'
    }
}, { timestamps: true });

LongFormSegmentSchema.index({ longFormRequestId: 1, segmentIndex: 1 }, { unique: true });

export default mongoose.model<ILongFormSegment>('LongFormSegment', LongFormSegmentSchema);