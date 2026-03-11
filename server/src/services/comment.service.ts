import { Comment, IComment, CalendarPost, ProductionProject, Month, User } from '../models/index.js';
import { CommentEntity, UserRole } from '@expertmri/shared';
import { Types } from 'mongoose';
import * as notificationService from './notification.service.js';
import type { IUser } from '../models/User.js';

/* ── Helpers ── */

async function getEntityName(entityType: CommentEntity, entityId: Types.ObjectId): Promise<string> {
  switch (entityType) {
    case CommentEntity.CALENDAR_POST: {
      const post = await CalendarPost.findById(entityId).select('title').lean();
      return post?.title || 'Untitled Post';
    }
    case CommentEntity.PRODUCTION_PROJECT: {
      const project = await ProductionProject.findById(entityId).select('projectName').lean();
      return project?.projectName || 'Untitled Project';
    }
    case CommentEntity.MONTH: {
      const month = await Month.findById(entityId).select('monthName year').lean();
      return month ? `${month.monthName} ${month.year}` : 'Unknown Month';
    }
    default:
      return 'Unknown';
  }
}

/* ── CRUD ── */

export async function getComments(entityType: CommentEntity, entityId: string) {
  const comments = await Comment.find({
    entityType,
    entityId: new Types.ObjectId(entityId),
    isDeleted: false,
  })
    .populate('authorId', 'name email picture')
    .sort({ createdAt: 1 })
    .lean();

  // Build threaded tree
  const topLevel: any[] = [];
  const childMap = new Map<string, any[]>();

  for (const c of comments) {
    const formatted = {
      _id: c._id,
      entityType: c.entityType,
      entityId: c.entityId,
      parentCommentId: c.parentCommentId?.toString() || null,
      author: c.authorId,
      text: c.text,
      isDeleted: c.isDeleted,
      replies: [] as any[],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };

    if (!c.parentCommentId) {
      topLevel.push(formatted);
    } else {
      const parentKey = c.parentCommentId.toString();
      if (!childMap.has(parentKey)) childMap.set(parentKey, []);
      childMap.get(parentKey)!.push(formatted);
    }
  }

  // Attach replies recursively (max 3 levels deep for safety)
  function attachReplies(comment: any, depth: number = 0): void {
    if (depth > 10) return;
    const children = childMap.get(comment._id.toString()) || [];
    comment.replies = children;
    for (const child of children) {
      attachReplies(child, depth + 1);
    }
  }

  for (const top of topLevel) {
    attachReplies(top);
  }

  return topLevel;
}

export async function addComment(
  entityType: CommentEntity,
  entityId: string,
  text: string,
  user: IUser,
  parentCommentId?: string
) {
  // Validate parent exists and belongs to same entity
  if (parentCommentId) {
    const parent = await Comment.findById(parentCommentId).lean();
    if (!parent) throw Object.assign(new Error('Parent comment not found'), { status: 404 });
    if (parent.entityId.toString() !== entityId) {
      throw Object.assign(new Error('Parent comment belongs to a different entity'), { status: 400 });
    }
  }

  const comment = await Comment.create({
    entityType,
    entityId: new Types.ObjectId(entityId),
    parentCommentId: parentCommentId ? new Types.ObjectId(parentCommentId) : null,
    authorId: user._id,
    text,
  });

  const populated = await Comment.findById(comment._id)
    .populate('authorId', 'name email picture')
    .lean();

  // Send notification
  const entityName = await getEntityName(entityType, new Types.ObjectId(entityId));
  await notificationService.onCommentAdded(
    entityName,
    entityType,
    new Types.ObjectId(entityId),
    text,
    parentCommentId ? new Types.ObjectId(parentCommentId) : null,
    user
  );

  return {
    _id: populated!._id,
    entityType: populated!.entityType,
    entityId: populated!.entityId,
    parentCommentId: populated!.parentCommentId?.toString() || null,
    author: populated!.authorId,
    text: populated!.text,
    isDeleted: populated!.isDeleted,
    replies: [],
    createdAt: populated!.createdAt,
    updatedAt: populated!.updatedAt,
  };
}

export async function updateComment(commentId: string, text: string, user: IUser) {
  const comment = await Comment.findById(commentId);
  if (!comment) throw Object.assign(new Error('Comment not found'), { status: 404 });

  if (comment.authorId.toString() !== user._id.toString() && user.role !== UserRole.ADMIN) {
    throw Object.assign(new Error('Only the author or admin can edit this comment'), { status: 403 });
  }

  comment.text = text;
  await comment.save();

  return Comment.findById(commentId).populate('authorId', 'name email picture').lean();
}

export async function deleteComment(commentId: string, user: IUser) {
  const comment = await Comment.findById(commentId);
  if (!comment) throw Object.assign(new Error('Comment not found'), { status: 404 });

  if (comment.authorId.toString() !== user._id.toString() && user.role !== UserRole.ADMIN) {
    throw Object.assign(new Error('Only the author or admin can delete this comment'), { status: 403 });
  }

  comment.isDeleted = true;
  comment.text = '[deleted]';
  await comment.save();
  return comment;
}
