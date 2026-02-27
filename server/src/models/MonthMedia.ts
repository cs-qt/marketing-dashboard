import { Schema, model, Document, Types } from 'mongoose';

export interface IMonthMedia extends Document {
  monthId: Types.ObjectId;
  mediaType: 'image' | 'video';
  title?: string;
  description?: string;
  activeVersionId?: Types.ObjectId;
  versionIds: Types.ObjectId[];
  isDeleted: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const monthMediaSchema = new Schema<IMonthMedia>(
  {
    monthId: { type: Schema.Types.ObjectId, ref: 'Month', required: true, index: true },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    title: { type: String },
    description: { type: String },
    activeVersionId: { type: Schema.Types.ObjectId, ref: 'MediaVersion' },
    versionIds: [{ type: Schema.Types.ObjectId, ref: 'MediaVersion' }],
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const MonthMedia = model<IMonthMedia>('MonthMedia', monthMediaSchema);
