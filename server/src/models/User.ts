import { Schema, model, Document } from 'mongoose';
import { UserRole, AuthMethod } from '@expertmri/shared';

export interface IUser extends Document {
  googleId?: string;
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
  authMethod: AuthMethod;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    googleId: { type: String, sparse: true, unique: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    picture: { type: String },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.CREATOR },
    authMethod: { type: String, enum: Object.values(AuthMethod), required: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
