import { Request, Response } from 'express';
import * as mediaService from '../services/media.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export async function listMedia(req: Request, res: Response): Promise<void> {
  const media = await mediaService.listMedia(req.params.monthId);
  sendSuccess(res, media);
}

export async function uploadMedia(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    sendError(res, 'No file uploaded');
    return;
  }
  const meta = {
    mediaType: (req.body.mediaType || 'image') as 'image' | 'video',
    title: req.body.title || '',
    description: req.body.description || '',
  };
  const media = await mediaService.uploadMedia(req.params.monthId, req.file as any, meta, req.user!);
  sendSuccess(res, media, 'Media uploaded', 201);
}

export async function uploadNewVersion(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    sendError(res, 'No file uploaded');
    return;
  }
  const media = await mediaService.uploadNewVersion(
    req.params.mediaId,
    req.file as any,
    req.body.resolution || 'original',
    req.body.notes || '',
    req.user!
  );
  sendSuccess(res, media, 'New version uploaded');
}

export async function switchActiveVersion(req: Request, res: Response): Promise<void> {
  const { versionId } = req.body;
  if (!versionId) {
    sendError(res, 'versionId is required');
    return;
  }
  const media = await mediaService.switchActiveVersion(req.params.mediaId, versionId);
  sendSuccess(res, media, 'Active version switched');
}

export async function listVersions(req: Request, res: Response): Promise<void> {
  const versions = await mediaService.listVersions(req.params.mediaId);
  sendSuccess(res, versions);
}

export async function downloadVersion(req: Request, res: Response): Promise<void> {
  const result = await mediaService.getDownloadUrl(req.params.versionId);
  sendSuccess(res, result);
}

export async function updateMedia(req: Request, res: Response): Promise<void> {
  const media = await mediaService.updateMedia(req.params.mediaId, req.body);
  sendSuccess(res, media, 'Media updated');
}

export async function deleteMedia(req: Request, res: Response): Promise<void> {
  await mediaService.deleteMedia(req.params.mediaId);
  sendSuccess(res, null, 'Media deleted');
}
