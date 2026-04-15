// models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firebaseUid: string;
  name: string;
  email: string;
  role: 'citizen' | 'admin';
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  firebaseUid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['citizen', 'admin'], default: 'citizen' },
  createdAt: { type: Date, default: Date.now },
});

// Prevent Mongoose from compiling the model multiple times in Next.js development
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);