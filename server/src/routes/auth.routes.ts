import { Router } from 'express';
import {
  googleAuth,
  googleCallback,
  requestMagicLink,
  verifyMagicLinkToken,
  getMe,
  logout,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { authLimiter, magicLinkLimiter } from '../middleware/rateLimiter.js';
import { magicLinkRequestSchema } from '../validators/auth.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

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
