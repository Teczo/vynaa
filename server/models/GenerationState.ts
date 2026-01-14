import mongoose, { Schema, Document } from 'mongoose';

export interface IGenerationState extends Document {
    longFormRequestId: mongoose.Types.ObjectId;
    version: number;
    currentSegmentIndex: number;

    coveredBullets: string[];
    openLoops: string[];
    glossary: Array<{ term: string; definition: string }>;
    nextSegmentGoal: string;
    lastSegmentTail: string;
    styleLock: {
        tone: string;
        examplePhrases: string[];
    };

    checksum: string;
    expiresAt?: Date;

    createdAt: Date;
}

const GenerationStateSchema = new Schema<IGenerationState>({
    longFormRequestId: {
        type: Schema.Types.ObjectId,
        ref: 'LongFormRequest',
        required: true,
        index: true
    },
    version: { type: Number, required: true, default: 1 },
    currentSegmentIndex: { type: Number, required: true },

    coveredBullets: [String],
    openLoops: [String],
    glossary: [{
        term: String,
        definition: String
    }],
    nextSegmentGoal: String,
    lastSegmentTail: String,
    styleLock: {
        tone: String,
        examplePhrases: [String]
    },

    checksum: { type: String, required: true },
    expiresAt: { type: Date, index: { expires: 0 } } // TTL index
}, { timestamps: true });

GenerationStateSchema.index({ longFormRequestId: 1, version: -1 });

export default mongoose.model<IGenerationState>('GenerationState', GenerationStateSchema);