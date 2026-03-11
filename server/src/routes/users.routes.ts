import { Router } from 'express';
import {
  listUsers,
  updateUserRole,
  updateUserStatus,
  inviteReviewer,
} from '../controllers/users.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { UserRole } from '@expertmri/shared';
import { updateRoleSchema, updateStatusSchema, inviteReviewerSchema } from '../validators/auth.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All user routes require admin
router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/', asyncHandler(listUsers));
router.patch('/:id/role', validate(updateRoleSchema), asyncHandler(updateUserRole));
router.patch('/:id/status', validate(updateStatusSchema), asyncHandler(updateUserStatus));
router.post('/invite-reviewer', validate(inviteReviewerSchema), asyncHandler(inviteReviewer));

export default router;
