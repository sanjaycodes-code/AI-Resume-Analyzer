import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type ResumeFileType = 'pdf' | 'docx';

export interface IParsedSections {
  skills: string[];
  experience: Record<string, unknown>[];
  education: Record<string, unknown>[];
  projects: Record<string, unknown>[];
}

export interface IResume extends Document {
  userId: Types.ObjectId;
  originalFileName: string;
  fileUrl: string;
  fileType: ResumeFileType;
  extractedText: string;
  parsedSections: IParsedSections;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
    },
    fileType: {
      type: String,
      enum: {
        values: ['pdf', 'docx'],
        message: '{VALUE} is not a supported file type. Must be "pdf" or "docx".',
      },
      required: [true, 'File type is required'],
    },
    extractedText: {
      type: String,
      default: '',
    },
    parsedSections: {
      skills: {
        type: [String],
        default: [],
      },
      experience: {
        type: [Schema.Types.Mixed],
        default: [],
      },
      education: {
        type: [Schema.Types.Mixed],
        default: [],
      },
      projects: {
        type: [Schema.Types.Mixed],
        default: [],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user dashboard queries
ResumeSchema.index({ userId: 1, createdAt: -1 });

export const Resume: Model<IResume> = mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);

export default Resume;
