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

// POST /api/records — Admin only, create a financial record
router.post('/', authorize('ADMIN'), validate(createRecordSchema), createRecordController);

// GET /api/records — all authenticated, paginated list with filters (type, category, date range, sort)
router.get('/', validate(listRecordsQuerySchema, 'query'), listRecordsController);

// GET /api/records/export — Admin only, download filtered records as CSV
router.get('/export', authorize('ADMIN'), validate(exportRecordsQuerySchema, 'query'), exportRecordsController);

// GET /api/records/:id — all authenticated, fetch single record by UUID
router.get('/:id', validate(uuidParamSchema, 'params'), getRecordByIdController);

// PATCH /api/records/:id — Admin only, partial update (amount, type, category, date, description)
router.patch('/:id', authorize('ADMIN'), validate(uuidParamSchema, 'params'), validate(updateRecordSchema), updateRecordController);

// DELETE /api/records/:id — Admin only, soft delete (isDeleted → true, hidden from all queries)
router.delete('/:id', authorize('ADMIN'), validate(uuidParamSchema, 'params'), softDeleteRecordController);

export default router;
