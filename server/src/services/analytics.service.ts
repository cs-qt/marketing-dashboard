import { GoogleAdsData, SeoData, SocialMediaData, ProductionProject } from '../models';
import { PostStatus, ProjectCategory } from '@expertmri/shared';
import { Types } from 'mongoose';
import type { UpsertGoogleAdsInput, UpsertSeoInput, UpsertSocialInput } from '../validators/analytics.validator';

/* ══════════════════════════════════════════════
   GOOGLE ADS
   ══════════════════════════════════════════════ */

export async function getAllGoogleAds(months?: string[]) {
  const filter = months?.length ? { monthKey: { $in: months } } : {};
  return GoogleAdsData.find(filter).sort({ monthKey: 1 }).lean();
}

export async function getGoogleAdsByMonth(monthKey: string) {
  return GoogleAdsData.findOne({ monthKey }).lean();
}

export async function upsertGoogleAds(
  monthKey: string,
  data: UpsertGoogleAdsInput,
  userId: Types.ObjectId
) {
  return GoogleAdsData.findOneAndUpdate(
    { monthKey },
    { ...data, monthKey, updatedBy: userId },
    { upsert: true, new: true, runValidators: true }
  ).lean();
}

export async function deleteGoogleAds(monthKey: string) {
  return GoogleAdsData.findOneAndDelete({ monthKey });
}

/* ══════════════════════════════════════════════
   SEO
   ══════════════════════════════════════════════ */

export async function getAllSeo(months?: string[]) {
  const filter = months?.length ? { monthKey: { $in: months } } : {};
  return SeoData.find(filter).sort({ monthKey: 1 }).lean();
}

export async function getSeoByMonth(monthKey: string) {
  return SeoData.findOne({ monthKey }).lean();
}

export async function upsertSeo(
  monthKey: string,
  data: UpsertSeoInput,
  userId: Types.ObjectId
) {
  return SeoData.findOneAndUpdate(
    { monthKey },
    { ...data, monthKey, updatedBy: userId },
    { upsert: true, new: true, runValidators: true }
  ).lean();
}

export async function deleteSeo(monthKey: string) {
  return SeoData.findOneAndDelete({ monthKey });
}

/* ══════════════════════════════════════════════
   SOCIAL MEDIA
   ══════════════════════════════════════════════ */

export async function getAllSocial(months?: string[]) {
  const filter = months?.length ? { monthKey: { $in: months } } : {};
  return SocialMediaData.find(filter).sort({ monthKey: 1 }).lean();
}

export async function getSocialByMonth(monthKey: string) {
  return SocialMediaData.findOne({ monthKey }).lean();
}

export async function upsertSocial(
  monthKey: string,
  data: UpsertSocialInput,
  userId: Types.ObjectId
) {
  return SocialMediaData.findOneAndUpdate(
    { monthKey },
    { ...data, monthKey, updatedBy: userId },
    { upsert: true, new: true, runValidators: true }
  ).lean();
}

export async function deleteSocial(monthKey: string) {
  return SocialMediaData.findOneAndDelete({ monthKey });
}

/* ══════════════════════════════════════════════
   DASHBOARD SUMMARY
   ══════════════════════════════════════════════ */

export async function getDashboardSummary() {
  const [googleAds, seo, social, approvedPrint, approvedVideo] = await Promise.all([
    GoogleAdsData.find().sort({ monthKey: 1 }).lean(),
    SeoData.find().sort({ monthKey: 1 }).lean(),
    SocialMediaData.find().sort({ monthKey: 1 }).lean(),
    ProductionProject.find({
      category: ProjectCategory.PRINT,
      status: PostStatus.APPROVED,
    })
      .populate('createdBy', 'name email picture')
      .sort({ monthKey: 1, approvedAt: -1 })
      .lean(),
    ProductionProject.find({
      category: ProjectCategory.VIDEO,
      status: PostStatus.APPROVED,
    })
      .populate('createdBy', 'name email picture')
      .sort({ monthKey: 1, approvedAt: -1 })
      .lean(),
  ]);

  // Group production projects by monthKey
  const groupByMonth = (projects: any[]) => {
    const grouped: Record<string, any[]> = {};
    for (const p of projects) {
      const key = p.monthKey || 'unassigned';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        _id: p._id,
        projectName: p.projectName,
        type: p.type,
        subject: p.subject,
        description: p.description,
        link: p.link,
        thumbnailUrl: p.thumbnailUrl,
        printReadyFile: p.printReadyFile
          ? {
              url: p.printReadyFile.url,
              fileName: p.printReadyFile.fileName,
              fileType: p.printReadyFile.fileType,
              fileSize: p.printReadyFile.fileSize,
            }
          : undefined,
        approvedAt: p.approvedAt,
        createdBy: p.createdBy,
      });
    }
    return grouped;
  };

  return {
    googleAds,
    seo,
    social,
    printProjects: { byMonth: groupByMonth(approvedPrint) },
    videoProjects: { byMonth: groupByMonth(approvedVideo) },
  };
}
