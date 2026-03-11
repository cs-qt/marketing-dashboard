import { Request, Response } from 'express';
import * as productionService from '../services/production.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export async function listProjects(req: Request, res: Response): Promise<void> {
  const { category, status, monthKey, page, limit } = req.query;
  const result = await productionService.listProjects({
    category: category as string,
    status: status as string,
    monthKey: monthKey as string,
    page: page ? parseInt(page as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
  });
  sendSuccess(res, result.projects, undefined, 200, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.ceil(result.total / result.limit),
  });
}

export async function getProject(req: Request, res: Response): Promise<void> {
  const project = await productionService.getProject(req.params.id);
  sendSuccess(res, project);
}

export async function createProject(req: Request, res: Response): Promise<void> {
  const project = await productionService.createProject(req.body, req.user!._id);
  sendSuccess(res, project, 'Project created', 201);
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  const project = await productionService.updateProject(req.params.id, req.body, req.user!);
  sendSuccess(res, project, 'Project updated');
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  await productionService.deleteProject(req.params.id);
  sendSuccess(res, null, 'Project deleted');
}

export async function changeStatus(req: Request, res: Response): Promise<void> {
  const { status, comment } = req.body;
  const project = await productionService.changeStatus(req.params.id, status, req.user!, comment);
  sendSuccess(res, project, `Status changed to ${status}`);
}

export async function uploadPrintReadyFile(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    sendError(res, 'No file uploaded');
    return;
  }
  const project = await productionService.uploadPrintReadyFile(
    req.params.id,
    req.file as any,
    req.user!
  );
  sendSuccess(res, project, 'Print-ready file uploaded');
}

export async function deletePrintReadyFile(req: Request, res: Response): Promise<void> {
  await productionService.deletePrintReadyFile(req.params.id, req.user!);
  sendSuccess(res, null, 'Print-ready file removed');
}

export async function downloadPrintReadyFile(req: Request, res: Response): Promise<void> {
  const result = await productionService.getPrintReadyDownloadUrl(req.params.id);
  sendSuccess(res, result);
}

export async function getApprovedProjects(req: Request, res: Response): Promise<void> {
  const category = req.query.category as string | undefined;
  const grouped = await productionService.getApprovedProjects(category);
  sendSuccess(res, grouped);
}
