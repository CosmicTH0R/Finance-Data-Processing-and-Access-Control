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

router.get('/me', getMeController);
router.get('/', authorize('ADMIN'), validate(listUsersQuerySchema, 'query'), listUsersController);
router.get('/:id', authorize('ADMIN'), validate(uuidParamSchema, 'params'), getUserByIdController);
router.patch('/:id', authorize('ADMIN'), validate(uuidParamSchema, 'params'), validate(updateUserSchema), updateUserController);
router.delete('/:id', authorize('ADMIN'), validate(uuidParamSchema, 'params'), deactivateUserController);

export default router;
