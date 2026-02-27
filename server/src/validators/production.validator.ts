import { z } from 'zod';
import { ProjectCategory, PostStatus } from '@expertmri/shared';

export const createProductionProjectSchema = z.object({
  category: z.nativeEnum(ProjectCategory),
  projectName: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
  subject: z.string().max(500).optional().default(''),
  description: z.string().max(5000).optional().default(''),
  link: z.string().url().optional(),
  monthKey: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  mediaUrls: z.array(z.string().url()).optional().default([]),
});

export const updateProductionProjectSchema = z.object({
  projectName: z.string().min(1).max(200).optional(),
  type: z.string().min(1).max(100).optional(),
  subject: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  link: z.string().url().nullable().optional(),
  monthKey: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).nullable().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
});

export const productionQuerySchema = z.object({
  category: z.nativeEnum(ProjectCategory).optional(),
  status: z.nativeEnum(PostStatus).optional(),
  monthKey: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type CreateProductionProjectInput = z.infer<typeof createProductionProjectSchema>;
export type UpdateProductionProjectInput = z.infer<typeof updateProductionProjectSchema>;
