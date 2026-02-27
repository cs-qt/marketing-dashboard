import { z } from 'zod';
import { CommentEntity } from '@expertmri/shared';

export const createCommentSchema = z.object({
  text: z.string().min(1).max(5000),
  parentCommentId: z.string().optional(),
});

export const updateCommentSchema = z.object({
  text: z.string().min(1).max(5000),
});

export const entityTypeParam = z.nativeEnum(CommentEntity);

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
