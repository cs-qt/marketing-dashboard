import { Schema, model, Document, Types } from 'mongoose';

export interface ISocialMediaData extends Document {
  monthKey: string;
  monthLabel: string;
  strategy: string;
  priorities: string[];
  followers: {
    total: number;
    change: number;
    maxDailyChange: number;
    avgDailyChange: number;
  };
  contentEngagement: Array<{
    type: string;
    posts: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reach: number;
  }>;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const socialMediaDataSchema = new Schema<ISocialMediaData>(
  {
    monthKey: { type: String, required: true, unique: true },
    monthLabel: { type: String, required: true },
    strategy: { type: String, default: '' },
    priorities: [{ type: String }],
    followers: {
      total: { type: Number, default: 0 },
      change: { type: Number, default: 0 },
      maxDailyChange: { type: Number, default: 0 },
      avgDailyChange: { type: Number, default: 0 },
    },
    contentEngagement: [
      {
        type: { type: String },
        posts: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        saves: { type: Number, default: 0 },
        reach: { type: Number, default: 0 },
        _id: false,
      },
    ],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const SocialMediaData = model<ISocialMediaData>('SocialMediaData', socialMediaDataSchema);
