import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { User } from '../models';
import { sendError } from '../utils/apiResponse';

/**
 * Verifies JWT from httpOnly cookie and attaches user to req.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.token;

    if (!token) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.userId).select('-__v');

    if (!user) {
      sendError(res, 'User not found', 401);
      return;
    }

    if (!user.isActive) {
      sendError(res, 'Account has been deactivated', 403);
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      sendError(res, 'Token expired, please login again', 401);
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      sendError(res, 'Invalid token', 401);
      return;
    }
    sendError(res, 'Authentication failed', 401);
  }
}
