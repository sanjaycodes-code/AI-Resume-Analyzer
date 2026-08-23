import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IEnhancedBullet {
  originalText: string;
  enhancedText: string;
  changesSummary: string[];
  createdAt: Date;
}

export interface IAnalysis extends Document {
  userId: Types.ObjectId;
  resumeId: Types.ObjectId;
  jobDescriptionId?: Types.ObjectId;
  atsScore?: number;
  overallScore?: number;
  skillsFound: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keywordAnalysis?: Record<string, unknown>;
  experienceAnalysis?: Record<string, unknown>;
  educationAnalysis?: Record<string, unknown>;
  projectAnalysis?: Record<string, unknown>;
  formattingAnalysis?: Record<string, unknown>;
  scoreBreakdown?: Record<string, unknown>;
  enhancedBullets: IEnhancedBullet[];
  rawAIResponse?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const EnhancedBulletSchema = new Schema<IEnhancedBullet>(
  {
    originalText: {
      type: String,
      required: [true, 'Original bullet text is required'],
    },
    enhancedText: {
      type: String,
      required: [true, 'Enhanced bullet text is required'],
    },
    changesSummary: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const AnalysisSchema = new Schema<IAnalysis>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      required: [true, 'Resume ID is required'],
      index: true,
    },
    jobDescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'JobDescription',
      required: false,
      index: true,
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    skillsFound: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },
    keywordAnalysis: {
      type: Schema.Types.Mixed,
    },
    experienceAnalysis: {
      type: Schema.Types.Mixed,
    },
    educationAnalysis: {
      type: Schema.Types.Mixed,
    },
    projectAnalysis: {
      type: Schema.Types.Mixed,
    },
    formattingAnalysis: {
      type: Schema.Types.Mixed,
    },
    scoreBreakdown: {
      type: Schema.Types.Mixed,
    },
    enhancedBullets: {
      type: [EnhancedBulletSchema],
      default: [],
    },
    rawAIResponse: {
      type: Schema.Types.Mixed,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for dashboard queries
AnalysisSchema.index({ userId: 1, createdAt: -1 });

// 30-day TTL index: MongoDB automatically purges documents 30 days after createdAt.
// NOTE: MongoDB TTL deletion happens server-side via a background thread and does NOT
// trigger Mongoose pre/post middleware hooks.
AnalysisSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const Analysis: Model<IAnalysis> =
  mongoose.models.Analysis || mongoose.model<IAnalysis>('Analysis', AnalysisSchema);

export default Analysis;
