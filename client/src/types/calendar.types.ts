import { PostStatus, Platform, PostType, ProjectCategory } from '@expertmri/shared';
import type { User } from './auth.types';

export interface CalendarPost {
  _id: string;
  date: string;
  platform: Platform;
  title: string;
  description: string;
  type: PostType;
  status: PostStatus;
  mediaUrls: string[];
  createdBy: User;
  approvedBy?: User;
  approvedAt?: string;
  scheduledBy?: User;
  scheduledAt?: string;
  commentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PrintReadyFile {
  s3Key: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ProductionProject {
  _id: string;
  category: ProjectCategory;
  projectName: string;
  type: string;
  subject: string;
  description: string;
  link?: string;
  monthKey?: string;
  status: PostStatus;
  thumbnailUrl?: string;
  printReadyFile?: PrintReadyFile;
  mediaUrls: string[];
  createdBy: User;
  approvedBy?: User;
  approvedAt?: string;
  commentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  entityType: string;
  entityId: string;
  parentCommentId: string | null;
  author: User;
  text: string;
  isDeleted: boolean;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}
