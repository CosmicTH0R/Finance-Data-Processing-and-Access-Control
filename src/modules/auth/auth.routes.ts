import { Router } from 'express';
import { register, login } from './auth.controller';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema } from './auth.schema';
import { z } from 'zod';

const router = Router();

// Extract just the body shape from the outer schema for use with validate middleware
const registerBodySchema = registerSchema.shape.body;
const loginBodySchema = loginSchema.shape.body;

/**
 * POST /api/auth/register
 * Public — creates a new user with VIEWER role by default
 */
router.post('/register', validate(registerBodySchema), register);

/**
 * POST /api/auth/login
 * Public — returns JWT on valid credentials
 */
router.post('/login', validate(loginBodySchema), login);

export default router;
