export interface GoogleAdsMonth {
  _id: string;
  monthKey: string;
  monthLabel: string;
  kpis: {
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    conversions: number;
    roas: number;
  };
  spend: { totalSpent: number; cpm: number };
  campaigns: { name: string; impr: number; spent: number }[];
  execSummary: string[];
  execStrategy: string[];
}

export interface SeoMonth {
  _id: string;
  monthKey: string;
  monthLabel: string;
  situation: string;
  inProgress: string[];
  geoKpis: {
    aiVisibilityScore?: number;
    attributionRate?: number;
    aiShareOfVoice?: number;
    attributionCtr?: number;
    aiTrafficSessions?: number;
    aiConversionRate?: number;
  };
  platformMentions: { name: string; mentions: number }[];
}

export interface SocialMonth {
  _id: string;
  monthKey: string;
  monthLabel: string;
  strategy: string;
  priorities: string[];
  followers: {
    total: number;
    change: number;
    maxDailyChange: number;
    avgDailyChange: number;
  };
  contentEngagement: {
    type: string;
    posts: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reach: number;
  }[];
}

export interface DashboardSummary {
  googleAds: GoogleAdsMonth[];
  seo: SeoMonth[];
  social: SocialMonth[];
  printProjects: { byMonth: Record<string, any[]> };
  videoProjects: { byMonth: Record<string, any[]> };
}
