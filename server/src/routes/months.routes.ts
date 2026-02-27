import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { UserRole } from '@expertmri/shared';
import { createMonthSchema, updateMonthSchema } from '../validators/media.validator';
import * as ctrl from '../controllers/months.controller';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(ctrl.listMonths));
router.get('/:id', asyncHandler(ctrl.getMonth));
router.post(
  '/',
  authorize(UserRole.ADMIN),
  validate(createMonthSchema),
  asyncHandler(ctrl.createMonth)
);
router.put(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(updateMonthSchema),
  asyncHandler(ctrl.updateMonth)
);
router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  asyncHandler(ctrl.deleteMonth)
);

export default router;
