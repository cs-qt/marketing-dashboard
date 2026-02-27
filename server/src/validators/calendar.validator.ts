import { z } from 'zod';
import { Platform, PostType, PostStatus } from '@expertmri/shared';

export const createCalendarPostSchema = z.object({
  date: z.string().datetime({ offset: true }).or(z.string().min(1)),
  platform: z.nativeEnum(Platform),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  type: z.nativeEnum(PostType),
  mediaUrls: z.array(z.string().url()).optional().default([]),
});

export const updateCalendarPostSchema = z.object({
  date: z.string().datetime({ offset: true }).or(z.string().min(1)).optional(),
  platform: z.nativeEnum(Platform).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  type: z.nativeEnum(PostType).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
});

export const statusChangeSchema = z.object({
  status: z.nativeEnum(PostStatus),
  comment: z.string().max(1000).optional(),
});

export const calendarQuerySchema = z.object({
  month: z.string().optional(),    // 1-12
  year: z.string().optional(),     // 2025, 2026
  platform: z.nativeEnum(Platform).optional(),
  status: z.nativeEnum(PostStatus).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type CreateCalendarPostInput = z.infer<typeof createCalendarPostSchema>;
export type UpdateCalendarPostInput = z.infer<typeof updateCalendarPostSchema>;
export type StatusChangeInput = z.infer<typeof statusChangeSchema>;
