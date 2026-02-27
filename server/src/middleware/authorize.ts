import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@expertmri/shared';
import { sendError } from '../utils/apiResponse';

/**
 * Factory that returns middleware restricting access to specified roles.
 * Usage: authorize(UserRole.ADMIN, UserRole.REVIEWER)
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      sendError(
        res,
        `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        403
      );
      return;
    }

    next();
  };
}
