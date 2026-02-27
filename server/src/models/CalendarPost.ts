import { Schema, model, Document, Types } from 'mongoose';
import { PostStatus, Platform, PostType } from '@expertmri/shared';

export interface ICalendarPost extends Document {
  date: Date;
  platform: Platform;
  title: string;
  description: string;
  type: PostType;
  status: PostStatus;
  mediaUrls: string[];
  createdBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  scheduledBy?: Types.ObjectId;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const calendarPostSchema = new Schema<ICalendarPost>(
  {
    date: { type: Date, required: true, index: true },
    platform: { type: String, enum: Object.values(Platform), required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: Object.values(PostType), required: true },
    status: {
      type: String,
      enum: Object.values(PostStatus),
      default: PostStatus.DRAFT,
      index: true,
    },
    mediaUrls: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    scheduledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    scheduledAt: { type: Date },
  },
  { timestamps: true }
);

calendarPostSchema.index({ date: 1, platform: 1 });
calendarPostSchema.index({ status: 1, date: 1 });

export const CalendarPost = model<ICalendarPost>('CalendarPost', calendarPostSchema);
