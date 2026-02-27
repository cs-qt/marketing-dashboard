import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { printReadyUpload } from '../middleware/upload';
import { UserRole } from '@expertmri/shared';
import {
  createProductionProjectSchema,
  updateProductionProjectSchema,
} from '../validators/production.validator';
import { statusChangeSchema } from '../validators/calendar.validator';
import * as ctrl from '../controllers/production.controller';

const router = Router();

router.use(authenticate);

/* ── Approved projects feed (for dashboard widgets) ── */
router.get('/approved', asyncHandler(ctrl.getApprovedProjects));

/* ── CRUD ── */
router.get('/projects', asyncHandler(ctrl.listProjects));
router.get('/projects/:id', asyncHandler(ctrl.getProject));
router.post(
  '/projects',
  authorize(UserRole.CREATOR, UserRole.ADMIN),
  validate(createProductionProjectSchema),
  asyncHandler(ctrl.createProject)
);
router.put(
  '/projects/:id',
  authorize(UserRole.CREATOR, UserRole.ADMIN),
  validate(updateProductionProjectSchema),
  asyncHandler(ctrl.updateProject)
);
router.delete(
  '/projects/:id',
  authorize(UserRole.ADMIN),
  asyncHandler(ctrl.deleteProject)
);

/* ── Approval Workflow ── */
router.patch(
  '/projects/:id/status',
  validate(statusChangeSchema),
  asyncHandler(ctrl.changeStatus)
);

/* ── Print-Ready File Management (Admin only) ── */
router.post(
  '/projects/:id/print-ready-file',
  authorize(UserRole.ADMIN),
  printReadyUpload.single('file'),
  asyncHandler(ctrl.uploadPrintReadyFile)
);
router.delete(
  '/projects/:id/print-ready-file',
  authorize(UserRole.ADMIN),
  asyncHandler(ctrl.deletePrintReadyFile)
);
router.get(
  '/projects/:id/download',
  asyncHandler(ctrl.downloadPrintReadyFile)
);

export default router;
