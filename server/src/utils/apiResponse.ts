import { Response } from 'express';
import { IApiResponse } from '@expertmri/shared';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  meta?: IApiResponse['meta']
): void {
  const response: IApiResponse<T> = { success: true, data, message, meta };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  error: string,
  statusCode = 400
): void {
  const response: IApiResponse = { success: false, error };
  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T, message?: string): void {
  sendSuccess(res, data, message, 201);
}
