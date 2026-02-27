import { Router } from 'express';
import {
  listUsers,
  updateUserRole,
  updateUserStatus,
  inviteReviewer,
} from '../controllers/users.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { UserRole } from '@expertmri/shared';
import { updateRoleSchema, updateStatusSchema, inviteReviewerSchema } from '../validators/auth.validator';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All user routes require admin
router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/', asyncHandler(listUsers));
router.patch('/:id/role', validate(updateRoleSchema), asyncHandler(updateUserRole));
router.patch('/:id/status', validate(updateStatusSchema), asyncHandler(updateUserStatus));
router.post('/invite-reviewer', validate(inviteReviewerSchema), asyncHandler(inviteReviewer));

export default router;
