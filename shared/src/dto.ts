import { UserRole, AuthMethod, PostStatus, Platform, PostType, ProjectCategory, CommentEntity, NotificationType } from './enums';

/* ══════════════════════════════════════════════
   USER
   ══════════════════════════════════════════════ */

export interface IUserDTO {
  _id: string;
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
  authMethod: AuthMethod;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

/* ══════════════════════════════════════════════
   CALENDAR POST
   ══════════════════════════════════════════════ */

export interface ICalendarPostDTO {
  _id: string;
  date: string;
  platform: Platform;
  title: string;
  description: string;
  type: PostType;
  status: PostStatus;
  mediaUrls: string[];
  createdBy: IUserDTO;
  approvedBy?: IUserDTO;
  approvedAt?: string;
  scheduledBy?: IUserDTO;
  scheduledAt?: string;
  commentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateCalendarPostDTO {
  date: string;
  platform: Platform;
  title: string;
  description?: string;
  type: PostType;
  mediaUrls?: string[];
}

export interface IUpdateCalendarPostDTO {
  date?: string;
  platform?: Platform;
  title?: string;
  description?: string;
  type?: PostType;
  mediaUrls?: string[];
}

export interface IStatusChangeDTO {
  status: PostStatus;
  comment?: string;
}

/* ══════════════════════════════════════════════
   PRODUCTION PROJECT
   ══════════════════════════════════════════════ */

export interface IPrintReadyFileDTO {
  s3Key: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface IProductionProjectDTO {
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
  printReadyFile?: IPrintReadyFileDTO;
  mediaUrls: string[];
  createdBy: IUserDTO;
  approvedBy?: IUserDTO;
  approvedAt?: string;
  commentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateProductionProjectDTO {
  category: ProjectCategory;
  projectName: string;
  type: string;
  subject?: string;
  description?: string;
  link?: string;
  monthKey?: string;
  mediaUrls?: string[];
}

/* ══════════════════════════════════════════════
   COMMENTS
   ══════════════════════════════════════════════ */

export interface ICommentDTO {
  _id: string;
  entityType: CommentEntity;
  entityId: string;
  parentCommentId?: string;
  author: IUserDTO;
  text: string;
  isDeleted: boolean;
  replies?: ICommentDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ICreateCommentDTO {
  text: string;
  parentCommentId?: string;
}

/* ══════════════════════════════════════════════
   API RESPONSE
   ══════════════════════════════════════════════ */

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
