import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(potentialPassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true }
}, {
  timestamps: true
});

// Pre-save hook to hash password
UserSchema.pre('save', async function (this: IUser) {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

UserSchema.methods.comparePassword = async function (potentialPassword: string): Promise<boolean> {
  return bcrypt.compare(potentialPassword, this.passwordHash);
};

export default mongoose.model<IUser>('User', UserSchema);
