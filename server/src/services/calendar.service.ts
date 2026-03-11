import { CalendarPost, ICalendarPost, Comment } from '../models/index.js';
import { PostStatus, STATUS_TRANSITIONS, TRANSITION_ROLES, UserRole, CommentEntity } from '@expertmri/shared';
import { Types } from 'mongoose';
import * as notificationService from './notification.service.js';
import type { IUser } from '../models/User.js';
import type { CreateCalendarPostInput, UpdateCalendarPostInput } from '../validators/calendar.validator.js';

/* ── Helpers ── */

function validateTransition(current: PostStatus, next: PostStatus, role: UserRole): void {
  const allowed = STATUS_TRANSITIONS[current];
  if (!allowed || !allowed.includes(next)) {
    throw Object.assign(new Error(`Cannot transition from ${current} to ${next}`), { status: 400 });
  }
  const key = `${current}→${next}`;
  const roles = TRANSITION_ROLES[key];
  if (!roles || !roles.includes(role)) {
    throw Object.assign(new Error(`Role '${role}' cannot perform ${current} → ${next}`), { status: 403 });
  }
}

/* ── CRUD ── */

export interface CalendarQuery {
  month?: string;
  year?: string;
  platform?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listPosts(query: CalendarQuery): Promise<{ posts: any[]; total: number; page: number; limit: number }> {
  const filter: any = {};

  if (query.month && query.year) {
    const m = parseInt(query.month, 10) - 1;
    const y = parseInt(query.year, 10);
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59);
    filter.date = { $gte: start, $lte: end };
  } else if (query.year) {
    const y = parseInt(query.year, 10);
    filter.date = { $gte: new Date(y, 0, 1), $lte: new Date(y, 11, 31, 23, 59, 59) };
  }

  if (query.platform) filter.platform = query.platform;
  if (query.status) filter.status = query.status;

  const page = query.page || 1;
  const limit = query.limit || 200;
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    CalendarPost.find(filter)
      .populate('createdBy', 'name email picture')
      .populate('approvedBy', 'name email picture')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CalendarPost.countDocuments(filter),
  ]);

  // Attach comment counts
  const postIds = posts.map((p) => p._id);
  const commentCounts = await Comment.aggregate([
    { $match: { entityType: CommentEntity.CALENDAR_POST, entityId: { $in: postIds }, isDeleted: false } },
    { $group: { _id: '$entityId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(commentCounts.map((c) => [c._id.toString(), c.count]));

  const enriched = posts.map((p) => ({
    ...p,
    commentCount: countMap.get(p._id.toString()) || 0,
  }));

  return { posts: enriched, total, page, limit };
}

export async function getPost(postId: string) {
  const post = await CalendarPost.findById(postId)
    .populate('createdBy', 'name email picture')
    .populate('approvedBy', 'name email picture')
    .populate('scheduledBy', 'name email picture')
    .lean();

  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 });
  return post;
}

export async function createPost(data: CreateCalendarPostInput, userId: Types.ObjectId) {
  const post = await CalendarPost.create({
    ...data,
    date: new Date(data.date),
    status: PostStatus.DRAFT,
    createdBy: userId,
  });
  return post.populate('createdBy', 'name email picture');
}

export async function updatePost(postId: string, data: UpdateCalendarPostInput, user: IUser) {
  const post = await CalendarPost.findById(postId);
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 });

  // Only draft or revision posts can be edited (unless admin)
  if (user.role !== UserRole.ADMIN && post.status !== PostStatus.DRAFT && post.status !== PostStatus.REVISION) {
    throw Object.assign(new Error('Can only edit posts in draft or revision status'), { status: 400 });
  }

  // Only creator or admin can edit
  if (user.role !== UserRole.ADMIN && post.createdBy.toString() !== user._id.toString()) {
    throw Object.assign(new Error('Only the creator or admin can edit this post'), { status: 403 });
  }

  Object.assign(post, data);
  if (data.date) post.date = new Date(data.date);
  await post.save();
  return post.populate('createdBy', 'name email picture');
}

export async function deletePost(postId: string) {
  const post = await CalendarPost.findByIdAndDelete(postId);
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 });
  // Also delete associated comments
  await Comment.deleteMany({ entityType: CommentEntity.CALENDAR_POST, entityId: post._id });
  return post;
}

/* ── Status Transition ── */

export async function changeStatus(
  postId: string,
  newStatus: PostStatus,
  user: IUser,
  comment?: string
) {
  const post = await CalendarPost.findById(postId);
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 });

  const currentStatus = post.status as PostStatus;
  validateTransition(currentStatus, newStatus, user.role as UserRole);

  post.status = newStatus;

  if (newStatus === PostStatus.APPROVED) {
    post.approvedBy = user._id;
    post.approvedAt = new Date();
  } else if (newStatus === PostStatus.SCHEDULED) {
    post.scheduledBy = user._id;
    post.scheduledAt = new Date();
  }

  await post.save();

  // Send notifications
  if (newStatus === PostStatus.PENDING_REVIEW) {
    await notificationService.onReviewSubmitted(
      post.title,
      CommentEntity.CALENDAR_POST,
      post._id,
      user
    );
  } else {
    await notificationService.onStatusChanged(
      post.title,
      CommentEntity.CALENDAR_POST,
      post._id,
      newStatus,
      user,
      post.createdBy,
      comment
    );
  }

  // If revision comment provided, add as a threaded comment
  if (comment && newStatus === PostStatus.REVISION) {
    await Comment.create({
      entityType: CommentEntity.CALENDAR_POST,
      entityId: post._id,
      authorId: user._id,
      text: `[Revision Request] ${comment}`,
    });
  }

  return post.populate('createdBy', 'name email picture');
}
