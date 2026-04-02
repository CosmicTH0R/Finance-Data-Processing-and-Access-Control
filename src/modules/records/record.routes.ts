import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createRecordSchema, updateRecordSchema, listRecordsQuerySchema, exportRecordsQuerySchema } from './record.schema';
import { uuidParamSchema } from '../../utils/common.schema';
import {
  createRecordController,
  listRecordsController,
  getRecordByIdController,
  updateRecordController,
  softDeleteRecordController,
  exportRecordsController,
} from './record.controller';

const router = Router();

// All routes require authentication
router.use(auth);

router.post('/', authorize('ADMIN'), validate(createRecordSchema), createRecordController);
router.get('/', validate(listRecordsQuerySchema, 'query'), listRecordsController);
router.get('/export', authorize('ADMIN'), validate(exportRecordsQuerySchema, 'query'), exportRecordsController);
router.get('/:id', validate(uuidParamSchema, 'params'), getRecordByIdController);
router.patch('/:id', authorize('ADMIN'), validate(uuidParamSchema, 'params'), validate(updateRecordSchema), updateRecordController);
router.delete('/:id', authorize('ADMIN'), validate(uuidParamSchema, 'params'), softDeleteRecordController);

export default router;
