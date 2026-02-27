/* ══════════════════════════════════════════════
   USER & AUTH
   ══════════════════════════════════════════════ */

export enum UserRole {
  CREATOR = 'creator',
  REVIEWER = 'reviewer',
  ADMIN = 'admin',
}

export enum AuthMethod {
  GOOGLE = 'google',
  MAGIC_LINK = 'magic_link',
}

/* ══════════════════════════════════════════════
   APPROVAL WORKFLOW
   ══════════════════════════════════════════════ */

export enum PostStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REVISION = 'revision',
  SCHEDULED = 'scheduled',
}

/** Valid status transitions enforced in backend */
export const STATUS_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
  [PostStatus.DRAFT]: [PostStatus.PENDING_REVIEW],
  [PostStatus.PENDING_REVIEW]: [PostStatus.APPROVED, PostStatus.REVISION],
  [PostStatus.REVISION]: [PostStatus.PENDING_REVIEW],
  [PostStatus.APPROVED]: [PostStatus.SCHEDULED],
  [PostStatus.SCHEDULED]: [],
};

/** Which roles can perform each transition */
export const TRANSITION_ROLES: Record<string, UserRole[]> = {
  [`${PostStatus.DRAFT}→${PostStatus.PENDING_REVIEW}`]: [UserRole.CREATOR, UserRole.ADMIN],
  [`${PostStatus.PENDING_REVIEW}→${PostStatus.APPROVED}`]: [UserRole.REVIEWER, UserRole.ADMIN],
  [`${PostStatus.PENDING_REVIEW}→${PostStatus.REVISION}`]: [UserRole.REVIEWER, UserRole.ADMIN],
  [`${PostStatus.REVISION}→${PostStatus.PENDING_REVIEW}`]: [UserRole.CREATOR, UserRole.ADMIN],
  [`${PostStatus.APPROVED}→${PostStatus.SCHEDULED}`]: [UserRole.ADMIN],
};

/* ══════════════════════════════════════════════
   CONTENT TYPES
   ══════════════════════════════════════════════ */

export enum Platform {
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  LINKEDIN = 'linkedin',
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok',
  BLOG = 'blog',
}

export enum PostType {
  REEL = 'reel',
  CAROUSEL = 'carousel',
  STATIC = 'static',
  STORY = 'story',
  LIVE = 'live',
  VIDEO = 'video',
  ARTICLE = 'article',
  LINK_POST = 'link_post',
  EVENT = 'event',
}

export enum ProjectCategory {
  PRINT = 'print',
  VIDEO = 'video',
}

/* ══════════════════════════════════════════════
   COMMENTS & NOTIFICATIONS
   ══════════════════════════════════════════════ */

export enum CommentEntity {
  CALENDAR_POST = 'calendar_post',
  PRODUCTION_PROJECT = 'production_project',
  MONTH = 'month',
}

export enum NotificationType {
  COMMENT_ADDED = 'comment_added',
  REPLY_ADDED = 'reply_added',
  STATUS_APPROVED = 'status_approved',
  STATUS_REVISION = 'status_revision',
  STATUS_SCHEDULED = 'status_scheduled',
  REVIEW_SUBMITTED = 'review_submitted',
  MAGIC_LINK = 'magic_link',
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}
