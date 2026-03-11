import { Request, Response } from 'express';
import * as calendarService from '../services/calendar.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export async function listPosts(req: Request, res: Response): Promise<void> {
  const { month, year, platform, status, page, limit } = req.query;
  const result = await calendarService.listPosts({
    month: month as string,
    year: year as string,
    platform: platform as string,
    status: status as string,
    page: page ? parseInt(page as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
  });
  sendSuccess(res, result.posts, undefined, 200, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.ceil(result.total / result.limit),
  });
}

export async function getPost(req: Request, res: Response): Promise<void> {
  const post = await calendarService.getPost(req.params.id);
  sendSuccess(res, post);
}

export async function createPost(req: Request, res: Response): Promise<void> {
  const post = await calendarService.createPost(req.body, req.user!._id);
  sendSuccess(res, post, 'Post created', 201);
}

export async function updatePost(req: Request, res: Response): Promise<void> {
  const post = await calendarService.updatePost(req.params.id, req.body, req.user!);
  sendSuccess(res, post, 'Post updated');
}

export async function deletePost(req: Request, res: Response): Promise<void> {
  await calendarService.deletePost(req.params.id);
  sendSuccess(res, null, 'Post deleted');
}

export async function changeStatus(req: Request, res: Response): Promise<void> {
  const { status, comment } = req.body;
  const post = await calendarService.changeStatus(req.params.id, status, req.user!, comment);
  sendSuccess(res, post, `Status changed to ${status}`);
}
