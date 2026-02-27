import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { mediaUpload } from '../middleware/upload';
import { UserRole } from '@expertmri/shared';
import { updateMonthMediaSchema } from '../validators/media.validator';
import * as ctrl from '../controllers/media.controller';

const router = Router();

router.use(authenticate);

/* ── List media for a month ── */
router.get('/:monthId', asyncHandler(ctrl.listMedia));

/* ── Upload new media to a month (multipart) ── */
router.post(
  '/:monthId/upload',
  authorize(UserRole.CREATOR, UserRole.ADMIN),
  mediaUpload.single('file'),
  asyncHandler(ctrl.uploadMedia)
);

/* ── Upload new version of existing media ── */
router.post(
  '/:mediaId/version',
  authorize(UserRole.CREATOR, UserRole.ADMIN),
  mediaUpload.single('file'),
  asyncHandler(ctrl.uploadNewVersion)
);

/* ── Switch active version ── */
router.patch(
  '/:mediaId/active-version',
  authorize(UserRole.CREATOR, UserRole.ADMIN),
  asyncHandler(ctrl.switchActiveVersion)
);

/* ── List all versions ── */
router.get('/:mediaId/versions', asyncHandler(ctrl.listVersions));

/* ── Download a specific version (signed URL) ── */
router.get('/version/:versionId/download', asyncHandler(ctrl.downloadVersion));

/* ── Update media metadata ── */
router.put(
  '/:mediaId/meta',
  authorize(UserRole.CREATOR, UserRole.ADMIN),
  validate(updateMonthMediaSchema),
  asyncHandler(ctrl.updateMedia)
);

/* ── Delete media (soft delete + S3 cleanup) ── */
router.delete(
  '/:mediaId',
  authorize(UserRole.ADMIN),
  asyncHandler(ctrl.deleteMedia)
);

export default router;
