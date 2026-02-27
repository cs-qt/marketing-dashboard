import api, { unwrap } from './client';
import type { DashboardSummary, GoogleAdsMonth, SeoMonth, SocialMonth } from '../types/analytics.types';

export const analyticsApi = {
  getDashboardSummary: () =>
    api.get('/analytics/dashboard-summary').then(unwrap<DashboardSummary>),

  getGoogleAds: () =>
    api.get('/analytics/google-ads').then(unwrap<GoogleAdsMonth[]>),

  getGoogleAdsByMonth: (monthKey: string) =>
    api.get(`/analytics/google-ads/${monthKey}`).then(unwrap<GoogleAdsMonth>),

  getSeo: () =>
    api.get('/analytics/seo').then(unwrap<SeoMonth[]>),

  getSocial: () =>
    api.get('/analytics/social').then(unwrap<SocialMonth[]>),
};
