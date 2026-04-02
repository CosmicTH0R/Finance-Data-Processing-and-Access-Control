import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { updateUserSchema, listUsersQuerySchema } from './user.schema';
import { uuidParamSchema } from '../../utils/common.schema';
import {
  getMeController,
  listUsersController,
  getUserByIdController,
  updateUserController,
  deactivateUserController,
} from './user.controller';

const router = Router();

// All routes require authentication
router.use(auth);

/**
 * GET /api/users/me
 * Any authenticated user — returns own profile
 * IMPORTANT: must be defined before /:id to avoid "me" being treated as an id
 */
router.get('/me', getMeController);

/**
 * GET /api/users
 * Admin only — paginated list with optional role/status filters
 */
router.get('/', authorize('ADMIN'), validate(listUsersQuerySchema, 'query'), listUsersController);

/**
 * GET /api/users/:id
 * Admin only — get a single user by ID
 */
router.get('/:id', authorize('ADMIN'), validate(uuidParamSchema, 'params'), getUserByIdController);

/**
 * PATCH /api/users/:id
 * Admin only — update role, status, or name
 */
router.patch('/:id', authorize('ADMIN'), validate(uuidParamSchema, 'params'), validate(updateUserSchema), updateUserController);

/**
 * DELETE /api/users/:id
 * Admin only — soft deactivate (sets status=INACTIVE); cannot deactivate self
 */
router.delete('/:id', authorize('ADMIN'), validate(uuidParamSchema, 'params'), deactivateUserController);

export default router;
