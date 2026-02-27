import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { createCommentSchema, updateCommentSchema } from '../validators/comment.validator';
import * as ctrl from '../controllers/comments.controller';

const router = Router();

router.use(authenticate);

/* ── Threaded Comments (polymorphic: calendar_post | production_project | month) ── */
router.get('/:entityType/:entityId', asyncHandler(ctrl.getComments));
router.post(
  '/:entityType/:entityId',
  validate(createCommentSchema),
  asyncHandler(ctrl.addComment)
);
router.put(
  '/:commentId',
  validate(updateCommentSchema),
  asyncHandler(ctrl.updateComment)
);
router.delete('/:commentId', asyncHandler(ctrl.deleteComment));

export default router;
