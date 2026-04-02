import rateLimit from 'express-rate-limit';

/**
 * Strict limiter for auth endpoints — prevents brute-force attacks.
 * 15 requests per 5 minutes per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again after 5 minutes',
    },
  },
});

/**
 * General API limiter — applied globally to prevent abuse.
 * 100 requests per 5 minutes per IP.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again later',
    },
  },
});
