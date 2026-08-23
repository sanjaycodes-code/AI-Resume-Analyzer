import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IJobDescription extends Document {
  userId: Types.ObjectId;
  title: string;
  rawText: string;
  roleCategory?: string;
  extractedKeywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

const JobDescriptionSchema = new Schema<IJobDescription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    rawText: {
      type: String,
      required: [true, 'Job description text is required'],
    },
    roleCategory: {
      type: String,
      default: 'general',
    },
    extractedKeywords: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const JobDescription: Model<IJobDescription> =
  mongoose.models.JobDescription || mongoose.model<IJobDescription>('JobDescription', JobDescriptionSchema);

export default JobDescription;
