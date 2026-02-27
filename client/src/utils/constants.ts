import { Platform, PostStatus, ProjectCategory } from '@expertmri/shared';

export const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; icon: string }> = {
  [Platform.INSTAGRAM]: { label: 'Instagram', color: '#E1306C', icon: '📸' },
  [Platform.FACEBOOK]:  { label: 'Facebook',  color: '#1877F2', icon: '📘' },
  [Platform.LINKEDIN]:  { label: 'LinkedIn',  color: '#0A66C2', icon: '💼' },
  [Platform.YOUTUBE]:   { label: 'YouTube',   color: '#FF0000', icon: '🎬' },
  [Platform.TIKTOK]:    { label: 'TikTok',    color: '#00f2ea', icon: '🎵' },
  [Platform.BLOG]:      { label: 'Blog',      color: '#F97316', icon: '✍️' },
};

export const STATUS_CONFIG: Record<PostStatus, { label: string; badgeClass: string; dotColor: string }> = {
  [PostStatus.DRAFT]:          { label: 'Draft',          badgeClass: 'badge-gray',   dotColor: '#94a3b8' },
  [PostStatus.PENDING_REVIEW]: { label: 'Pending Review', badgeClass: 'badge-yellow', dotColor: '#f59e0b' },
  [PostStatus.APPROVED]:       { label: 'Approved',       badgeClass: 'badge-green',  dotColor: '#22c55e' },
  [PostStatus.REVISION]:       { label: 'Revision',       badgeClass: 'badge-red',    dotColor: '#ef4444' },
  [PostStatus.SCHEDULED]:      { label: 'Scheduled',      badgeClass: 'badge-blue',   dotColor: '#3b82f6' },
};

export const CATEGORY_CONFIG: Record<ProjectCategory, { label: string; icon: string }> = {
  [ProjectCategory.PRINT]: { label: 'Print & Design', icon: '🖨️' },
  [ProjectCategory.VIDEO]: { label: 'Video Production', icon: '🎬' },
};

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
