import { Router } from 'express';
import { register, login } from './auth.controller';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema } from './auth.schema';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { z } from 'zod';

const router = Router();

const registerBodySchema = registerSchema.shape.body;
const loginBodySchema = loginSchema.shape.body;

router.post('/register', authRateLimiter, validate(registerBodySchema), register);
router.post('/login', authRateLimiter, validate(loginBodySchema), login);

export default router;
