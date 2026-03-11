import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UserRole } from '@expertmri/shared';
import { createMonthSchema, updateMonthSchema } from '../validators/media.validator.js';
import * as ctrl from '../controllers/months.controller.js';

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
