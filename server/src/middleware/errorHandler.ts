import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors)
      .map((e: any) => e.message)
      .join('; ');
    res.status(422).json({ success: false, error: `Validation error: ${messages}` });
    return;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    res.status(409).json({ success: false, error: `Duplicate value for ${field}` });
    return;
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({ success: false, error: `Invalid ${err.path}: ${err.value}` });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
    return;
  }

  // Default
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Something went wrong';

  res.status(statusCode).json({ success: false, error: message });
}
