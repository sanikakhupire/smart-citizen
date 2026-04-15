// models/Issue.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IIssue extends Document {
  title: string;
  description: string;
  category: 'road' | 'water' | 'electricity' | 'garbage' | 'other';
  imageUrl: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'pending' | 'in-progress' | 'resolved' | 'duplicate'; // Added 'duplicate'
  priority: 'low' | 'medium' | 'high';
  reportedBy: string;
  aiSuggestedSolution?: string; // New AI Field
  duplicateOf?: mongoose.Types.ObjectId; // New AI Field (Self-referencing)
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true }, // AI will override user input if necessary
  imageUrl: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'resolved', 'duplicate'], 
    default: 'pending' 
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  reportedBy: { type: String, required: true },
  aiSuggestedSolution: { type: String },
  duplicateOf: { type: Schema.Types.ObjectId, ref: 'Issue' },
}, { timestamps: true });

export default mongoose.models.Issue || mongoose.model<IIssue>('Issue', IssueSchema);