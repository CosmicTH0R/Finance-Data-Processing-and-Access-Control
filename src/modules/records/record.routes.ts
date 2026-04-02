import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createRecordSchema, updateRecordSchema, listRecordsQuerySchema } from './record.schema';
import { uuidParamSchema } from '../../utils/common.schema';
import {
  createRecordController,
  listRecordsController,
  getRecordByIdController,
  updateRecordController,
  softDeleteRecordController,
} from './record.controller';

const router = Router();

// All routes require authentication
router.use(auth);

/**
 * POST /api/records
 * Admin only — create a new financial record linked to the authenticated user
 */
router.post('/', authorize('ADMIN'), validate(createRecordSchema), createRecordController);

/**
 * GET /api/records
 * All authenticated — paginated list with optional filters
 * ?type=INCOME&category=Salary&startDate=...&endDate=...&page=1&limit=20&sortBy=date&sortOrder=desc
 */
router.get('/', validate(listRecordsQuerySchema, 'query'), listRecordsController);

/**
 * GET /api/records/:id
 * All authenticated — single record by ID (404 if soft-deleted)
 */
router.get('/:id', validate(uuidParamSchema, 'params'), getRecordByIdController);

/**
 * PATCH /api/records/:id
 * Admin only — partial update, validates only provided fields
 */
router.patch('/:id', authorize('ADMIN'), validate(uuidParamSchema, 'params'), validate(updateRecordSchema), updateRecordController);

/**
 * DELETE /api/records/:id
 * Admin only — soft delete (sets isDeleted=true, never hard-deletes)
 */
router.delete('/:id', authorize('ADMIN'), validate(uuidParamSchema, 'params'), softDeleteRecordController);

export default router;
