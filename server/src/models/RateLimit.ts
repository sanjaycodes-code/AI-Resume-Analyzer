import mongoose, { Schema, Document } from 'mongoose';

export interface IRateLimitDoc extends Document {
  key: string;
  count: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RateLimitSchema = new Schema<IRateLimitDoc>(
  {
    key: { type: String, required: true, unique: true, index: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB automatic TTL cleanup
  },
  { timestamps: true }
);

export const RateLimitModel = mongoose.model<IRateLimitDoc>('RateLimit', RateLimitSchema);
