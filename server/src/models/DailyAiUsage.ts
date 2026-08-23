import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyAiUsage extends Document {
  date: string; // YYYY-MM-DD (UTC)
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

const DailyAiUsageSchema = new Schema<IDailyAiUsage>(
  {
    date: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const DailyAiUsage =
  mongoose.models.DailyAiUsage ||
  mongoose.model<IDailyAiUsage>('DailyAiUsage', DailyAiUsageSchema);

export default DailyAiUsage;
