import { Month, MonthMedia, MediaVersion, Comment, IMonthMedia, IMediaVersion } from '../models/index.js';
import { CommentEntity } from '@expertmri/shared';
import { Types } from 'mongoose';
import * as s3Service from './s3.service.js';
import type { IUser } from '../models/User.js';
import type { CreateMonthInput, UpdateMonthInput, CreateMonthMediaInput, UpdateMonthMediaInput } from '../validators/media.validator.js';

/* ══════════════════════════════════════════════
   MONTHS
   ══════════════════════════════════════════════ */

export async function listMonths(year?: number) {
  const filter = year ? { year } : {};
  return Month.find(filter)
    .populate('createdBy', 'name email picture')
    .sort({ year: -1, _id: -1 })
    .lean();
}

export async function getMonth(monthId: string) {
  const month = await Month.findById(monthId)
    .populate('createdBy', 'name email picture')
    .populate({
      path: 'mediaIds',
      populate: {
        path: 'activeVersionId',
        model: 'MediaVersion',
      },
    })
    .lean();

  if (!month) throw Object.assign(new Error('Month not found'), { status: 404 });
  return month;
}

export async function createMonth(data: CreateMonthInput, userId: Types.ObjectId) {
  const existing = await Month.findOne({ monthName: data.monthName, year: data.year });
  if (existing) {
    throw Object.assign(new Error(`${data.monthName} ${data.year} already exists`), { status: 409 });
  }
  const month = await Month.create({ ...data, createdBy: userId });
  return month.populate('createdBy', 'name email picture');
}

export async function updateMonth(monthId: string, data: UpdateMonthInput) {
  const month = await Month.findByIdAndUpdate(monthId, data, { new: true, runValidators: true })
    .populate('createdBy', 'name email picture');
  if (!month) throw Object.assign(new Error('Month not found'), { status: 404 });
  return month;
}

export async function deleteMonth(monthId: string) {
  const month = await Month.findById(monthId);
  if (!month) throw Object.assign(new Error('Month not found'), { status: 404 });

  // Delete all associated media + versions + S3 files
  const mediaItems = await MonthMedia.find({ monthId: month._id });
  for (const media of mediaItems) {
    const versions = await MediaVersion.find({ mediaId: media._id });
    for (const v of versions) {
      await s3Service.deleteFile(v.s3Key).catch(() => {});
    }
    await MediaVersion.deleteMany({ mediaId: media._id });
  }
  await MonthMedia.deleteMany({ monthId: month._id });
  await Comment.deleteMany({ entityType: CommentEntity.MONTH, entityId: month._id });
  await month.deleteOne();
  return month;
}

/* ══════════════════════════════════════════════
   MONTH MEDIA
   ══════════════════════════════════════════════ */

export async function listMedia(monthId: string) {
  return MonthMedia.find({ monthId: new Types.ObjectId(monthId), isDeleted: { $ne: true } })
    .populate('activeVersionId')
    .populate('createdBy', 'name email picture')
    .sort({ createdAt: -1 })
    .lean();
}

export async function uploadMedia(
  monthId: string,
  file: Express.Multer.File & { key?: string; location?: string },
  meta: CreateMonthMediaInput,
  user: IUser
) {
  const month = await Month.findById(monthId);
  if (!month) throw Object.assign(new Error('Month not found'), { status: 404 });

  const s3Key = file.key || `months/${monthId}/media/${Date.now()}_${file.originalname}`;
  const url = file.location || (await s3Service.getSignedUrl(s3Key));

  // Create version
  const version = await MediaVersion.create({
    mediaId: new Types.ObjectId(), // placeholder, will update
    s3Key,
    url,
    resolution: 'original',
    fileType: file.mimetype,
    fileSize: file.size,
    isActive: true,
    versionNumber: 1,
    notes: '',
    uploadedBy: user._id,
  });

  // Create month media
  const media = await MonthMedia.create({
    monthId: month._id,
    mediaType: meta.mediaType,
    title: meta.title || file.originalname,
    description: meta.description || '',
    activeVersionId: version._id,
    versionIds: [version._id],
    createdBy: user._id,
  });

  // Update version with correct mediaId
  version.mediaId = media._id;
  await version.save();

  // Add to month
  month.mediaIds.push(media._id);
  await month.save();

  return MonthMedia.findById(media._id)
    .populate('activeVersionId')
    .populate('createdBy', 'name email picture')
    .lean();
}

export async function uploadNewVersion(
  mediaId: string,
  file: Express.Multer.File & { key?: string; location?: string },
  resolution: string,
  notes: string,
  user: IUser
) {
  const media = await MonthMedia.findById(mediaId);
  if (!media) throw Object.assign(new Error('Media not found'), { status: 404 });

  // Determine next version number
  const lastVersion = await MediaVersion.findOne({ mediaId: media._id })
    .sort({ versionNumber: -1 })
    .lean();
  const nextVersionNum = (lastVersion?.versionNumber || 0) + 1;

  const s3Key = file.key || `months/${media.monthId}/media/${mediaId}/v${nextVersionNum}_${file.originalname}`;
  const url = file.location || (await s3Service.getSignedUrl(s3Key));

  // Deactivate all previous versions
  await MediaVersion.updateMany({ mediaId: media._id }, { isActive: false });

  // Create new version
  const version = await MediaVersion.create({
    mediaId: media._id,
    s3Key,
    url,
    resolution: resolution || 'original',
    fileType: file.mimetype,
    fileSize: file.size,
    isActive: true,
    versionNumber: nextVersionNum,
    notes: notes || '',
    uploadedBy: user._id,
  });

  // Update media
  media.activeVersionId = version._id;
  media.versionIds.push(version._id);
  await media.save();

  return MonthMedia.findById(media._id)
    .populate('activeVersionId')
    .populate('createdBy', 'name email picture')
    .lean();
}

export async function switchActiveVersion(mediaId: string, versionId: string) {
  const media = await MonthMedia.findById(mediaId);
  if (!media) throw Object.assign(new Error('Media not found'), { status: 404 });

  const version = await MediaVersion.findById(versionId);
  if (!version || version.mediaId.toString() !== mediaId) {
    throw Object.assign(new Error('Version not found for this media'), { status: 404 });
  }

  await MediaVersion.updateMany({ mediaId: media._id }, { isActive: false });
  version.isActive = true;
  await version.save();

  media.activeVersionId = version._id;
  await media.save();

  return MonthMedia.findById(media._id)
    .populate('activeVersionId')
    .populate('createdBy', 'name email picture')
    .lean();
}

export async function listVersions(mediaId: string) {
  return MediaVersion.find({ mediaId: new Types.ObjectId(mediaId) })
    .populate('uploadedBy', 'name email picture')
    .sort({ versionNumber: -1 })
    .lean();
}

export async function getDownloadUrl(versionId: string) {
  const version = await MediaVersion.findById(versionId).lean();
  if (!version) throw Object.assign(new Error('Version not found'), { status: 404 });

  const url = await s3Service.getSignedUrl(version.s3Key);
  return { url, fileName: version.s3Key.split('/').pop(), fileType: version.fileType, fileSize: version.fileSize };
}

export async function updateMedia(mediaId: string, data: UpdateMonthMediaInput) {
  const media = await MonthMedia.findByIdAndUpdate(mediaId, data, { new: true, runValidators: true })
    .populate('activeVersionId')
    .populate('createdBy', 'name email picture');
  if (!media) throw Object.assign(new Error('Media not found'), { status: 404 });
  return media;
}

export async function deleteMedia(mediaId: string) {
  const media = await MonthMedia.findById(mediaId);
  if (!media) throw Object.assign(new Error('Media not found'), { status: 404 });

  // Delete all versions from S3
  const versions = await MediaVersion.find({ mediaId: media._id });
  for (const v of versions) {
    await s3Service.deleteFile(v.s3Key).catch(() => {});
  }
  await MediaVersion.deleteMany({ mediaId: media._id });

  // Remove from month
  await Month.findByIdAndUpdate(media.monthId, { $pull: { mediaIds: media._id } });

  // Soft delete
  media.isDeleted = true;
  await media.save();
  return media;
}
