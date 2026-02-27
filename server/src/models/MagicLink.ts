import { Schema, model, Document, Types } from 'mongoose';

export interface IMagicLink extends Document {
  email: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  userId?: Types.ObjectId;
}

const magicLinkSchema = new Schema<IMagicLink>(
  {
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// TTL index — auto-delete expired tokens after 1 hour past expiry
magicLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

export const MagicLink = model<IMagicLink>('MagicLink', magicLinkSchema);
