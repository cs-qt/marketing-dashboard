import type { User } from './auth.types';

export interface MonthData {
  _id: string;
  monthName: string;
  year: number;
  title: string;
  description: string;
  mediaIds: MonthMedia[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface MonthMedia {
  _id: string;
  monthId: string;
  mediaType: 'image' | 'video';
  title: string;
  description: string;
  activeVersionId: MediaVersion | null;
  versionIds: string[];
  createdBy: User;
  createdAt: string;
}

export interface MediaVersion {
  _id: string;
  mediaId: string;
  s3Key: string;
  url: string;
  resolution: string;
  fileType: string;
  fileSize: number;
  isActive: boolean;
  versionNumber: number;
  notes: string;
  uploadedBy: User;
  uploadedAt: string;
}
