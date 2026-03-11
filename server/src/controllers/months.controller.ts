import { Request, Response } from 'express';
import * as mediaService from '../services/media.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export async function listMonths(req: Request, res: Response): Promise<void> {
  const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
  const months = await mediaService.listMonths(year);
  sendSuccess(res, months);
}

export async function getMonth(req: Request, res: Response): Promise<void> {
  const month = await mediaService.getMonth(req.params.id);
  sendSuccess(res, month);
}

export async function createMonth(req: Request, res: Response): Promise<void> {
  const month = await mediaService.createMonth(req.body, req.user!._id);
  sendSuccess(res, month, 'Month created', 201);
}

export async function updateMonth(req: Request, res: Response): Promise<void> {
  const month = await mediaService.updateMonth(req.params.id, req.body);
  sendSuccess(res, month, 'Month updated');
}

export async function deleteMonth(req: Request, res: Response): Promise<void> {
  await mediaService.deleteMonth(req.params.id);
  sendSuccess(res, null, 'Month and all associated media deleted');
}
