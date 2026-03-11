import { Request, Response } from 'express';
import { User } from '../models/index.js';
import { UserRole, AuthMethod } from '@expertmri/shared';
import { sendSuccess, sendError, sendCreated } from '../utils/apiResponse.js';
import { generateMagicLink } from '../services/magicLink.service.js';
import { logger } from '../utils/logger.js';

/**
 * GET /api/users
 */
export async function listUsers(req: Request, res: Response): Promise<void> {
  const users = await User.find()
    .select('-__v')
    .sort({ createdAt: -1 });
  sendSuccess(res, users);
}

/**
 * PATCH /api/users/:id/role
 */
export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { role } = req.body;

  const user = await User.findById(id);
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  // Prevent removing last admin
  if (user.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
    const adminCount = await User.countDocuments({ role: UserRole.ADMIN, isActive: true });
    if (adminCount <= 1) {
      sendError(res, 'Cannot remove the last admin', 400);
      return;
    }
  }

  user.role = role;
  await user.save();
  sendSuccess(res, user, 'Role updated');
}

/**
 * PATCH /api/users/:id/status
 */
export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { isActive } = req.body;

  const user = await User.findById(id);
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  // Prevent deactivating self
  if (req.user?._id.toString() === id && !isActive) {
    sendError(res, 'Cannot deactivate your own account', 400);
    return;
  }

  user.isActive = isActive;
  await user.save();
  sendSuccess(res, user, `User ${isActive ? 'activated' : 'deactivated'}`);
}

/**
 * POST /api/users/invite-reviewer
 */
export async function inviteReviewer(req: Request, res: Response): Promise<void> {
  const { email, name } = req.body;

  // Check if user exists
  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    if (user.role === UserRole.REVIEWER) {
      // Re-send magic link
      await generateMagicLink(email);
      sendSuccess(res, user, 'Magic link re-sent to existing reviewer');
      return;
    }
    sendError(res, `User already exists with role: ${user.role}`, 409);
    return;
  }

  // Create reviewer user
  user = await User.create({
    email: email.toLowerCase().trim(),
    name: name.trim(),
    role: UserRole.REVIEWER,
    authMethod: AuthMethod.MAGIC_LINK,
  });

  // Send magic link
  await generateMagicLink(email);
  logger.info(`Reviewer invited: ${email}`);
  sendCreated(res, user, 'Reviewer invited and magic link sent');
}
