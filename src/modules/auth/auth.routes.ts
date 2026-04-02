import { Router } from 'express';
import { register, login } from './auth.controller';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema } from './auth.schema';
import { authRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

const registerBodySchema = registerSchema.shape.body;
const loginBodySchema = loginSchema.shape.body;

// POST /api/auth/register — public, creates a VIEWER-role user, returns JWT
router.post('/register', authRateLimiter, validate(registerBodySchema), register);

// POST /api/auth/login — public, validates credentials, returns JWT
router.post('/login', authRateLimiter, validate(loginBodySchema), login);

export default router;
