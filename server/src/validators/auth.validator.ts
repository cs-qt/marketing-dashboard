import { z } from 'zod';

export const magicLinkRequestSchema = z.object({
  email: z.string().email('Valid email is required').trim().toLowerCase(),
});

export const inviteReviewerSchema = z.object({
  email: z.string().email('Valid email is required').trim().toLowerCase(),
  name: z.string().min(1, 'Name is required').trim(),
});

export const updateRoleSchema = z.object({
  role: z.enum(['creator', 'reviewer', 'admin'], {
    errorMap: () => ({ message: 'Role must be creator, reviewer, or admin' }),
  }),
});

export const updateStatusSchema = z.object({
  isActive: z.boolean(),
});
