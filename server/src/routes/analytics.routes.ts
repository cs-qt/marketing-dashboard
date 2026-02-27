import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { UserRole } from '@expertmri/shared';
import {
  upsertGoogleAdsSchema,
  upsertSeoSchema,
  upsertSocialSchema,
} from '../validators/analytics.validator';
import * as ctrl from '../controllers/analytics.controller';

const router = Router();

router.use(authenticate);

/* ── Dashboard Summary (all roles) ── */
router.get('/dashboard-summary', asyncHandler(ctrl.getDashboardSummary));

/* ── Google Ads ── */
router.get('/google-ads', asyncHandler(ctrl.getAllGoogleAds));
router.get('/google-ads/:monthKey', asyncHandler(ctrl.getGoogleAdsByMonth));
router.put(
  '/google-ads/:monthKey',
  authorize(UserRole.ADMIN),
  validate(upsertGoogleAdsSchema),
  asyncHandler(ctrl.upsertGoogleAds)
);
router.delete(
  '/google-ads/:monthKey',
  authorize(UserRole.ADMIN),
  asyncHandler(ctrl.deleteGoogleAds)
);

/* ── SEO ── */
router.get('/seo', asyncHandler(ctrl.getAllSeo));
router.get('/seo/:monthKey', asyncHandler(ctrl.getSeoByMonth));
router.put(
  '/seo/:monthKey',
  authorize(UserRole.ADMIN),
  validate(upsertSeoSchema),
  asyncHandler(ctrl.upsertSeo)
);
router.delete(
  '/seo/:monthKey',
  authorize(UserRole.ADMIN),
  asyncHandler(ctrl.deleteSeo)
);

/* ── Social Media ── */
router.get('/social', asyncHandler(ctrl.getAllSocial));
router.get('/social/:monthKey', asyncHandler(ctrl.getSocialByMonth));
router.put(
  '/social/:monthKey',
  authorize(UserRole.ADMIN),
  validate(upsertSocialSchema),
  asyncHandler(ctrl.upsertSocial)
);
router.delete(
  '/social/:monthKey',
  authorize(UserRole.ADMIN),
  asyncHandler(ctrl.deleteSocial)
);

export default router;
