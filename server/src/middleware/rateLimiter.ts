import rateLimit from 'express-rate-limit';

/** General API rate limit */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Strict limit for auth endpoints */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many auth attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Magic link request limit (prevent email flooding) */
export const magicLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, error: 'Too many magic link requests, try again in an hour' },
  standardHeaders: true,
  legacyHeaders: false,
});
