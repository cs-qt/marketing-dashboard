import { Schema, model, Document, Types } from 'mongoose';

export interface IGoogleAdsData extends Document {
  monthKey: string;
  monthLabel: string;
  kpis: {
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    conversions: number;
    roas: number;
  };
  spend: {
    totalSpent: number;
    cpm: number;
  };
  campaigns: Array<{ name: string; impr: number; spent: number }>;
  execSummary: string[];
  execStrategy: string[];
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const googleAdsDataSchema = new Schema<IGoogleAdsData>(
  {
    monthKey: { type: String, required: true, unique: true },
    monthLabel: { type: String, required: true },
    kpis: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      cpc: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      roas: { type: Number, default: 0 },
    },
    spend: {
      totalSpent: { type: Number, default: 0 },
      cpm: { type: Number, default: 0 },
    },
    campaigns: [
      {
        name: { type: String },
        impr: { type: Number },
        spent: { type: Number },
        _id: false,
      },
    ],
    execSummary: [{ type: String }],
    execStrategy: [{ type: String }],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const GoogleAdsData = model<IGoogleAdsData>('GoogleAdsData', googleAdsDataSchema);
