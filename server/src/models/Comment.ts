import { Schema, model, Document, Types } from 'mongoose';
import { CommentEntity } from '@expertmri/shared';

export interface IComment extends Document {
  entityType: CommentEntity;
  entityId: Types.ObjectId;
  parentCommentId?: Types.ObjectId;
  authorId: Types.ObjectId;
  text: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    entityType: { type: String, enum: Object.values(CommentEntity), required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ entityType: 1, entityId: 1, parentCommentId: 1 });
commentSchema.index({ entityId: 1, createdAt: 1 });

export const Comment = model<IComment>('Comment', commentSchema);
