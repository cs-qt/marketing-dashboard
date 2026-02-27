import { Schema, model, Document, Types } from 'mongoose';

export interface IMediaVersion extends Document {
  mediaId: Types.ObjectId;
  s3Key: string;
  url: string;
  resolution: string;
  fileType: string;
  fileSize: number;
  isActive: boolean;
  versionNumber: number;
  notes?: string;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

const mediaVersionSchema = new Schema<IMediaVersion>({
  mediaId: { type: Schema.Types.ObjectId, ref: 'MonthMedia', required: true, index: true },
  s3Key: { type: String, required: true },
  url: { type: String, required: true },
  resolution: { type: String, default: 'original' },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  versionNumber: { type: Number, required: true },
  notes: { type: String },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export const MediaVersion = model<IMediaVersion>('MediaVersion', mediaVersionSchema);
