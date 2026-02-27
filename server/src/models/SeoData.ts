import { Schema, model, Document, Types } from 'mongoose';

export interface ISeoData extends Document {
  monthKey: string;
  monthLabel: string;
  situation: string;
  inProgress: string[];
  geoKpis: {
    aiVisibilityScore: number;
    attributionRate: number;
    aiShareOfVoice: number;
    attributionCtr: number;
    aiTrafficSessions: number;
    aiConversionRate: number;
  };
  platformMentions: Array<{ name: string; mentions: number }>;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const seoDataSchema = new Schema<ISeoData>(
  {
    monthKey: { type: String, required: true, unique: true },
    monthLabel: { type: String, required: true },
    situation: { type: String, default: '' },
    inProgress: [{ type: String }],
    geoKpis: {
      aiVisibilityScore: { type: Number, default: 0 },
      attributionRate: { type: Number, default: 0 },
      aiShareOfVoice: { type: Number, default: 0 },
      attributionCtr: { type: Number, default: 0 },
      aiTrafficSessions: { type: Number, default: 0 },
      aiConversionRate: { type: Number, default: 0 },
    },
    platformMentions: [
      {
        name: { type: String },
        mentions: { type: Number },
        _id: false,
      },
    ],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const SeoData = model<ISeoData>('SeoData', seoDataSchema);
