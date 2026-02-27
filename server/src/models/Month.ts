import { Schema, model, Document, Types } from 'mongoose';

export interface IMonth extends Document {
  monthName: string;
  year: number;
  title?: string;
  description?: string;
  mediaIds: Types.ObjectId[];
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const monthSchema = new Schema<IMonth>(
  {
    monthName: { type: String, required: true },
    year: { type: Number, required: true },
    title: { type: String },
    description: { type: String },
    mediaIds: [{ type: Schema.Types.ObjectId, ref: 'MonthMedia' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

monthSchema.index({ year: 1, monthName: 1 }, { unique: true });

export const Month = model<IMonth>('Month', monthSchema);
