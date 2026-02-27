import { Notification, User, IUser, Comment } from '../models';
import { NotificationType, CommentEntity, UserRole } from '@expertmri/shared';
import { sendEmail } from './email.service';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';
import { env } from '../config/env';

interface NotifyParams {
  recipientId: Types.ObjectId;
  recipientEmail: string;
  type: NotificationType;
  subject: string;
  entityType: string;
  entityId: Types.ObjectId;
  triggeredBy: Types.ObjectId;
  html: string;
}

async function notify(params: NotifyParams): Promise<void> {
  try {
    const sent = await sendEmail({
      to: params.recipientEmail,
      subject: params.subject,
      html: params.html,
    });

    await Notification.create({
      recipientId: params.recipientId,
      recipientEmail: params.recipientEmail,
      type: params.type,
      subject: params.subject,
      entityType: params.entityType,
      entityId: params.entityId,
      triggeredBy: params.triggeredBy,
      ...(sent ? { sentAt: new Date() } : { failedAt: new Date(), error: 'Email send failed' }),
    });
  } catch (error) {
    logger.error('Notification error:', error);
  }
}

function wrap(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background: #f8fafc; padding: 40px 0;">
      <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,.1);">
        <h2 style="font-size: 18px; color: #111827; margin: 0 0 16px;">${title}</h2>
        ${body}
        <hr style="border: none; border-top: 1px solid #F3F4F6; margin: 24px 0;" />
        <a href="${env.clientUrl}" style="display: inline-block; background: #111827; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">Open Dashboard</a>
        <p style="font-size: 11px; color: #D1D5DB; margin-top: 20px;">ExpertMRI Marketing Dashboard | © Quadrant Technology</p>
      </div>
    </body>
    </html>`;
}

/* ── Public API ── */

export async function onStatusChanged(
  entityName: string,
  entityType: string,
  entityId: Types.ObjectId,
  newStatus: string,
  triggeredBy: IUser,
  creatorId: Types.ObjectId,
  comment?: string
): Promise<void> {
  const creator = await User.findById(creatorId);
  if (!creator) return;

  const typeMap: Record<string, NotificationType> = {
    approved: NotificationType.STATUS_APPROVED,
    revision: NotificationType.STATUS_REVISION,
    scheduled: NotificationType.STATUS_SCHEDULED,
  };
  const nType = typeMap[newStatus];
  if (!nType) return;

  const subject = `${entityName} — ${newStatus === 'approved' ? 'Approved ✓' : newStatus === 'revision' ? 'Revision Requested' : 'Scheduled'}`;
  const body = `
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">
      <strong>${triggeredBy.name}</strong> changed the status of <strong>"${entityName}"</strong> to <strong>${newStatus}</strong>.
    </p>
    ${comment ? `<div style="background: #F9FAFB; border-left: 3px solid #7C3AED; padding: 12px 16px; border-radius: 8px; margin: 16px 0;"><p style="font-size: 13px; color: #374151; margin: 0;">${comment}</p></div>` : ''}
  `;

  await notify({
    recipientId: creator._id,
    recipientEmail: creator.email,
    type: nType,
    subject,
    entityType,
    entityId,
    triggeredBy: triggeredBy._id,
    html: wrap(subject, body),
  });
}

export async function onReviewSubmitted(
  entityName: string,
  entityType: string,
  entityId: Types.ObjectId,
  triggeredBy: IUser
): Promise<void> {
  // Notify all reviewers + admins
  const reviewers = await User.find({
    role: { $in: [UserRole.REVIEWER, UserRole.ADMIN] },
    isActive: true,
    _id: { $ne: triggeredBy._id },
  });

  const subject = `New Review Request: "${entityName}"`;
  const body = `<p style="font-size: 14px; color: #374151; line-height: 1.6;"><strong>${triggeredBy.name}</strong> submitted <strong>"${entityName}"</strong> for review.</p>`;

  for (const reviewer of reviewers) {
    await notify({
      recipientId: reviewer._id,
      recipientEmail: reviewer.email,
      type: NotificationType.REVIEW_SUBMITTED,
      subject,
      entityType,
      entityId,
      triggeredBy: triggeredBy._id,
      html: wrap(subject, body),
    });
  }
}

export async function onCommentAdded(
  entityName: string,
  entityType: string,
  entityId: Types.ObjectId,
  commentText: string,
  parentCommentId: Types.ObjectId | null,
  triggeredBy: IUser
): Promise<void> {
  const recipients = new Set<string>();

  if (parentCommentId) {
    // Notify parent comment author
    const parent = await Comment.findById(parentCommentId).populate('authorId');
    if (parent && parent.authorId.toString() !== triggeredBy._id.toString()) {
      const author = await User.findById(parent.authorId);
      if (author) recipients.add(author._id.toString());
    }
  }

  // Also notify all unique comment participants on this entity
  const allComments = await Comment.find({ entityType, entityId, isDeleted: false })
    .select('authorId')
    .lean();
  for (const c of allComments) {
    if (c.authorId.toString() !== triggeredBy._id.toString()) {
      recipients.add(c.authorId.toString());
    }
  }

  const subject = `New comment on "${entityName}"`;
  const body = `
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">
      <strong>${triggeredBy.name}</strong> ${parentCommentId ? 'replied to a comment' : 'commented'} on <strong>"${entityName}"</strong>:
    </p>
    <div style="background: #F9FAFB; border-left: 3px solid #7C3AED; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
      <p style="font-size: 13px; color: #374151; margin: 0;">${commentText}</p>
    </div>`;

  for (const rid of recipients) {
    const user = await User.findById(rid);
    if (!user || !user.isActive) continue;

    await notify({
      recipientId: user._id,
      recipientEmail: user.email,
      type: parentCommentId ? NotificationType.REPLY_ADDED : NotificationType.COMMENT_ADDED,
      subject,
      entityType,
      entityId,
      triggeredBy: triggeredBy._id,
      html: wrap(subject, body),
    });
  }
}
