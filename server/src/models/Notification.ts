import { Schema, model, Document, Types } from 'mongoose';
import { NotificationType } from '@expertmri/shared';

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  recipientEmail: string;
  type: NotificationType;
  subject: string;
  entityType: string;
  entityId: Types.ObjectId;
  triggeredBy: Types.ObjectId;
  sentAt?: Date;
  failedAt?: Date;
  error?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientEmail: { type: String, required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    subject: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    triggeredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sentAt: { type: Date },
    failedAt: { type: Date },
    error: { type: String },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
