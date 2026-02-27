import { z } from 'zod';

/* ── Month Key Format: "YYYY-MM" ── */
const monthKeyRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const monthKeyParam = z.object({
  monthKey: z.string().regex(monthKeyRegex, 'Format: YYYY-MM'),
});

/* ── Google Ads ── */

const campaignSchema = z.object({
  name: z.string().min(1),
  impr: z.number().min(0),
  spent: z.number().min(0),
});

export const upsertGoogleAdsSchema = z.object({
  monthLabel: z.string().min(1),
  kpis: z.object({
    impressions: z.number().min(0),
    clicks: z.number().min(0),
    ctr: z.number(),
    cpc: z.number(),
    conversions: z.number().min(0),
    roas: z.number(),
  }),
  spend: z.object({
    totalSpent: z.number().min(0),
    cpm: z.number(),
  }),
  campaigns: z.array(campaignSchema).optional().default([]),
  execSummary: z.array(z.string()).optional().default([]),
  execStrategy: z.array(z.string()).optional().default([]),
});

/* ── SEO ── */

const platformMentionSchema = z.object({
  name: z.string().min(1),
  mentions: z.number().min(0),
});

export const upsertSeoSchema = z.object({
  monthLabel: z.string().min(1),
  situation: z.string().optional().default(''),
  inProgress: z.array(z.string()).optional().default([]),
  geoKpis: z.object({
    aiVisibilityScore: z.number().optional(),
    attributionRate: z.number().optional(),
    aiShareOfVoice: z.number().optional(),
    attributionCtr: z.number().optional(),
    aiTrafficSessions: z.number().optional(),
    aiConversionRate: z.number().optional(),
  }),
  platformMentions: z.array(platformMentionSchema).optional().default([]),
});

/* ── Social Media ── */

const contentEngagementSchema = z.object({
  type: z.string().min(1),
  posts: z.number().min(0),
  likes: z.number().min(0),
  comments: z.number().min(0),
  shares: z.number().min(0),
  saves: z.number().min(0),
  reach: z.number().min(0),
});

export const upsertSocialSchema = z.object({
  monthLabel: z.string().min(1),
  strategy: z.string().optional().default(''),
  priorities: z.array(z.string()).optional().default([]),
  followers: z.object({
    total: z.number().min(0),
    change: z.number(),
    maxDailyChange: z.number(),
    avgDailyChange: z.number(),
  }),
  contentEngagement: z.array(contentEngagementSchema).optional().default([]),
});

/* ── Import ── */

export const importSheetsSchema = z.object({
  csvUrls: z.object({
    googleAds: z.string().url().optional(),
    seo: z.string().url().optional(),
    social: z.string().url().optional(),
  }),
});

export type UpsertGoogleAdsInput = z.infer<typeof upsertGoogleAdsSchema>;
export type UpsertSeoInput = z.infer<typeof upsertSeoSchema>;
export type UpsertSocialInput = z.infer<typeof upsertSocialSchema>;
