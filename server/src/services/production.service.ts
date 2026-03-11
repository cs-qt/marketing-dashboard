import { ProductionProject, IProductionProject, Comment } from '../models/index.js';
import { PostStatus, STATUS_TRANSITIONS, TRANSITION_ROLES, UserRole, CommentEntity, ProjectCategory } from '@expertmri/shared';
import { Types } from 'mongoose';
import * as notificationService from './notification.service.js';
import * as s3Service from './s3.service.js';
import type { IUser } from '../models/User.js';
import type { CreateProductionProjectInput, UpdateProductionProjectInput } from '../validators/production.validator.js';

/* ── Helpers ── */

function validateTransition(current: PostStatus, next: PostStatus, role: UserRole): void {
  const allowed = STATUS_TRANSITIONS[current];
  if (!allowed || !allowed.includes(next)) {
    throw Object.assign(new Error(`Cannot transition from ${current} to ${next}`), { status: 400 });
  }
  const key = `${current}→${next}`;
  const roles = TRANSITION_ROLES[key];
  if (!roles || !roles.includes(role)) {
    throw Object.assign(new Error(`Role '${role}' cannot perform ${current} → ${next}`), { status: 403 });
  }
}

/* ── CRUD ── */

export interface ProductionQuery {
  category?: string;
  status?: string;
  monthKey?: string;
  page?: number;
  limit?: number;
}

export async function listProjects(query: ProductionQuery): Promise<{ projects: any[]; total: number; page: number; limit: number }> {
  const filter: any = {};
  if (query.category) filter.category = query.category;
  if (query.status) filter.status = query.status;
  if (query.monthKey) filter.monthKey = query.monthKey;

  const page = query.page || 1;
  const limit = query.limit || 100;
  const skip = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    ProductionProject.find(filter)
      .populate('createdBy', 'name email picture')
      .populate('approvedBy', 'name email picture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ProductionProject.countDocuments(filter),
  ]);

  // Attach comment counts
  const ids = projects.map((p) => p._id);
  const commentCounts = await Comment.aggregate([
    { $match: { entityType: CommentEntity.PRODUCTION_PROJECT, entityId: { $in: ids }, isDeleted: false } },
    { $group: { _id: '$entityId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(commentCounts.map((c) => [c._id.toString(), c.count]));

  const enriched = projects.map((p) => ({
    ...p,
    commentCount: countMap.get(p._id.toString()) || 0,
  }));

  return { projects: enriched, total, page, limit };
}

export async function getProject(projectId: string) {
  const project = await ProductionProject.findById(projectId)
    .populate('createdBy', 'name email picture')
    .populate('approvedBy', 'name email picture')
    .lean();

  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
  return project;
}

export async function createProject(data: CreateProductionProjectInput, userId: Types.ObjectId) {
  const project = await ProductionProject.create({
    ...data,
    status: PostStatus.DRAFT,
    createdBy: userId,
  });
  return project.populate('createdBy', 'name email picture');
}

export async function updateProject(projectId: string, data: UpdateProductionProjectInput, user: IUser) {
  const project = await ProductionProject.findById(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });

  if (user.role !== UserRole.ADMIN && project.status !== PostStatus.DRAFT && project.status !== PostStatus.REVISION) {
    throw Object.assign(new Error('Can only edit projects in draft or revision status'), { status: 400 });
  }

  if (user.role !== UserRole.ADMIN && project.createdBy.toString() !== user._id.toString()) {
    throw Object.assign(new Error('Only the creator or admin can edit this project'), { status: 403 });
  }

  Object.assign(project, data);
  await project.save();
  return project.populate('createdBy', 'name email picture');
}

export async function deleteProject(projectId: string) {
  const project = await ProductionProject.findByIdAndDelete(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
  await Comment.deleteMany({ entityType: CommentEntity.PRODUCTION_PROJECT, entityId: project._id });
  // Delete print-ready file from S3 if exists
  if (project.printReadyFile?.s3Key) {
    await s3Service.deleteFile(project.printReadyFile.s3Key).catch(() => {});
  }
  return project;
}

/* ── Status Transition ── */

export async function changeStatus(
  projectId: string,
  newStatus: PostStatus,
  user: IUser,
  comment?: string
) {
  const project = await ProductionProject.findById(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });

  const currentStatus = project.status as PostStatus;
  validateTransition(currentStatus, newStatus, user.role as UserRole);

  project.status = newStatus;

  if (newStatus === PostStatus.APPROVED) {
    project.approvedBy = user._id;
    project.approvedAt = new Date();
  }

  await project.save();

  // Notifications
  if (newStatus === PostStatus.PENDING_REVIEW) {
    await notificationService.onReviewSubmitted(
      project.projectName,
      CommentEntity.PRODUCTION_PROJECT,
      project._id,
      user
    );
  } else {
    await notificationService.onStatusChanged(
      project.projectName,
      CommentEntity.PRODUCTION_PROJECT,
      project._id,
      newStatus,
      user,
      project.createdBy,
      comment
    );
  }

  // Revision comment
  if (comment && newStatus === PostStatus.REVISION) {
    await Comment.create({
      entityType: CommentEntity.PRODUCTION_PROJECT,
      entityId: project._id,
      authorId: user._id,
      text: `[Revision Request] ${comment}`,
    });
  }

  return project.populate('createdBy', 'name email picture');
}

/* ── Print-Ready File ── */

export async function uploadPrintReadyFile(
  projectId: string,
  file: Express.Multer.File & { key?: string; location?: string },
  user: IUser
) {
  const project = await ProductionProject.findById(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });

  // Only admin can upload print-ready files
  if (user.role !== UserRole.ADMIN) {
    throw Object.assign(new Error('Only admins can upload print-ready files'), { status: 403 });
  }

  // Delete old file from S3 if replacing
  if (project.printReadyFile?.s3Key) {
    await s3Service.deleteFile(project.printReadyFile.s3Key).catch(() => {});
  }

  const s3Key = file.key || `production/${project.category}/${projectId}/print-ready/${file.originalname}`;
  const url = file.location || await s3Service.getSignedUrl(s3Key);

  project.printReadyFile = {
    s3Key,
    url,
    fileName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
    uploadedBy: user._id,
    uploadedAt: new Date(),
  };

  await project.save();
  return project.populate('createdBy', 'name email picture');
}

export async function deletePrintReadyFile(projectId: string, user: IUser) {
  const project = await ProductionProject.findById(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });

  if (user.role !== UserRole.ADMIN) {
    throw Object.assign(new Error('Only admins can delete print-ready files'), { status: 403 });
  }

  if (project.printReadyFile?.s3Key) {
    await s3Service.deleteFile(project.printReadyFile.s3Key).catch(() => {});
  }

  project.printReadyFile = undefined;
  await project.save();
  return project;
}

export async function getPrintReadyDownloadUrl(projectId: string) {
  const project = await ProductionProject.findById(projectId).lean();
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
  if (!project.printReadyFile?.s3Key) {
    throw Object.assign(new Error('No print-ready file attached'), { status: 404 });
  }
  const url = await s3Service.getSignedUrl(project.printReadyFile.s3Key);
  return { url, fileName: project.printReadyFile.fileName, fileType: project.printReadyFile.fileType };
}

/* ── Approved Projects for Dashboard ── */

export async function getApprovedProjects(category?: string) {
  const filter: any = { status: PostStatus.APPROVED };
  if (category) filter.category = category;

  const projects = await ProductionProject.find(filter)
    .populate('createdBy', 'name email picture')
    .sort({ monthKey: 1, approvedAt: -1 })
    .lean();

  const grouped: Record<string, any[]> = {};
  for (const p of projects) {
    const key = p.monthKey || 'unassigned';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  }

  return grouped;
}
