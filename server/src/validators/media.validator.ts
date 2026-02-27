import { z } from 'zod';

/* ── Months ── */

export const createMonthSchema = z.object({
  monthName: z.string().min(1).max(20),
  year: z.number().int().min(2020).max(2100),
  title: z.string().max(200).optional().default(''),
  description: z.string().max(5000).optional().default(''),
});

export const updateMonthSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
});

/* ── Month Media ── */

export const createMonthMediaSchema = z.object({
  mediaType: z.enum(['image', 'video']),
  title: z.string().max(200).optional().default(''),
  description: z.string().max(2000).optional().default(''),
});

export const updateMonthMediaSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
});

/* ── Media Version ── */

export const createMediaVersionSchema = z.object({
  resolution: z.string().max(50).optional().default('original'),
  notes: z.string().max(1000).optional().default(''),
});

export type CreateMonthInput = z.infer<typeof createMonthSchema>;
export type UpdateMonthInput = z.infer<typeof updateMonthSchema>;
export type CreateMonthMediaInput = z.infer<typeof createMonthMediaSchema>;
export type UpdateMonthMediaInput = z.infer<typeof updateMonthMediaSchema>;
