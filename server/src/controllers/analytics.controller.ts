import { Request, Response } from 'express';
import * as analyticsService from '../services/analytics.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

/* ══════════════════════════════════════════════
   GOOGLE ADS
   ══════════════════════════════════════════════ */

export async function getAllGoogleAds(req: Request, res: Response): Promise<void> {
  const months = req.query.months ? (req.query.months as string).split(',') : undefined;
  const data = await analyticsService.getAllGoogleAds(months);
  sendSuccess(res, data);
}

export async function getGoogleAdsByMonth(req: Request, res: Response): Promise<void> {
  const data = await analyticsService.getGoogleAdsByMonth(req.params.monthKey);
  if (!data) {
    sendError(res, `No Google Ads data for ${req.params.monthKey}`, 404);
    return;
  }
  sendSuccess(res, data);
}

export async function upsertGoogleAds(req: Request, res: Response): Promise<void> {
  const data = await analyticsService.upsertGoogleAds(
    req.params.monthKey,
    req.body,
    req.user!._id
  );
  sendSuccess(res, data, 'Google Ads data saved');
}

export async function deleteGoogleAds(req: Request, res: Response): Promise<void> {
  const result = await analyticsService.deleteGoogleAds(req.params.monthKey);
  if (!result) {
    sendError(res, `No Google Ads data for ${req.params.monthKey}`, 404);
    return;
  }
  sendSuccess(res, null, 'Google Ads data deleted');
}

/* ══════════════════════════════════════════════
   SEO
   ══════════════════════════════════════════════ */

export async function getAllSeo(req: Request, res: Response): Promise<void> {
  const months = req.query.months ? (req.query.months as string).split(',') : undefined;
  const data = await analyticsService.getAllSeo(months);
  sendSuccess(res, data);
}

export async function getSeoByMonth(req: Request, res: Response): Promise<void> {
  const data = await analyticsService.getSeoByMonth(req.params.monthKey);
  if (!data) {
    sendError(res, `No SEO data for ${req.params.monthKey}`, 404);
    return;
  }
  sendSuccess(res, data);
}

export async function upsertSeo(req: Request, res: Response): Promise<void> {
  const data = await analyticsService.upsertSeo(
    req.params.monthKey,
    req.body,
    req.user!._id
  );
  sendSuccess(res, data, 'SEO data saved');
}

export async function deleteSeo(req: Request, res: Response): Promise<void> {
  const result = await analyticsService.deleteSeo(req.params.monthKey);
  if (!result) {
    sendError(res, `No SEO data for ${req.params.monthKey}`, 404);
    return;
  }
  sendSuccess(res, null, 'SEO data deleted');
}

/* ══════════════════════════════════════════════
   SOCIAL MEDIA
   ══════════════════════════════════════════════ */

export async function getAllSocial(req: Request, res: Response): Promise<void> {
  const months = req.query.months ? (req.query.months as string).split(',') : undefined;
  const data = await analyticsService.getAllSocial(months);
  sendSuccess(res, data);
}

export async function getSocialByMonth(req: Request, res: Response): Promise<void> {
  const data = await analyticsService.getSocialByMonth(req.params.monthKey);
  if (!data) {
    sendError(res, `No Social data for ${req.params.monthKey}`, 404);
    return;
  }
  sendSuccess(res, data);
}

export async function upsertSocial(req: Request, res: Response): Promise<void> {
  const data = await analyticsService.upsertSocial(
    req.params.monthKey,
    req.body,
    req.user!._id
  );
  sendSuccess(res, data, 'Social media data saved');
}

export async function deleteSocial(req: Request, res: Response): Promise<void> {
  const result = await analyticsService.deleteSocial(req.params.monthKey);
  if (!result) {
    sendError(res, `No Social data for ${req.params.monthKey}`, 404);
    return;
  }
  sendSuccess(res, null, 'Social data deleted');
}

/* ══════════════════════════════════════════════
   DASHBOARD SUMMARY
   ══════════════════════════════════════════════ */

export async function getDashboardSummary(_req: Request, res: Response): Promise<void> {
  const summary = await analyticsService.getDashboardSummary();
  sendSuccess(res, summary);
}
