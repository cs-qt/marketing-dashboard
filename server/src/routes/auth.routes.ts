import { Router } from 'express';
import {
  googleAuth,
  googleCallback,
  requestMagicLink,
  verifyMagicLinkToken,
  getMe,
  logout,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { authLimiter, magicLinkLimiter } from '../middleware/rateLimiter';
import { magicLinkRequestSchema } from '../validators/auth.validator';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Google OAuth
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Magic Link
router.post(
  '/magic-link',
  magicLinkLimiter,
  validate(magicLinkRequestSchema),
  asyncHandler(requestMagicLink)
);
router.get('/magic-link/verify', asyncHandler(verifyMagicLinkToken));

// Current User
router.get('/me', authenticate, asyncHandler(getMe));

// Logout
router.post('/logout', authenticate, asyncHandler(logout));

export default router;
