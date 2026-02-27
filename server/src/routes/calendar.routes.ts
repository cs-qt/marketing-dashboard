import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { UserRole } from '@expertmri/shared';
import {
  createCalendarPostSchema,
  updateCalendarPostSchema,
  statusChangeSchema,
} from '../validators/calendar.validator';
import * as ctrl from '../controllers/calendar.controller';

const router = Router();

router.use(authenticate);

/* ── CRUD ── */
router.get('/posts', asyncHandler(ctrl.listPosts));
router.get('/posts/:id', asyncHandler(ctrl.getPost));
router.post(
  '/posts',
  authorize(UserRole.CREATOR, UserRole.ADMIN),
  validate(createCalendarPostSchema),
  asyncHandler(ctrl.createPost)
);
router.put(
  '/posts/:id',
  authorize(UserRole.CREATOR, UserRole.ADMIN),
  validate(updateCalendarPostSchema),
  asyncHandler(ctrl.updatePost)
);
router.delete(
  '/posts/:id',
  authorize(UserRole.ADMIN),
  asyncHandler(ctrl.deletePost)
);

/* ── Approval Workflow ── */
router.patch(
  '/posts/:id/status',
  validate(statusChangeSchema),
  asyncHandler(ctrl.changeStatus)
);

export default router;
