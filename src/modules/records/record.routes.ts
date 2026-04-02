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

/**
 * @openapi
 * /records:
 *   post:
 *     tags: [Records]
 *     summary: Create a financial record (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000.00
 *                 description: Positive number, max 2 decimal places
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *                 example: Salary
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-08-01T00:00:00.000Z"
 *                 description: ISO 8601, must not be in the future
 *               description:
 *                 type: string
 *                 example: August salary payment
 *     responses:
 *       201:
 *         description: Record created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     record: { $ref: '#/components/schemas/FinancialRecord' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Forbidden — Admin only
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   get:
 *     tags: [Records]
 *     summary: List records with filters and pagination (all authenticated)
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [INCOME, EXPENSE] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Case-insensitive partial match
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [date, amount, createdAt], default: date }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated records list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     records:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/FinancialRecord' }
 *                     pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.post('/', authorize('ADMIN'), validate(createRecordSchema), createRecordController);
router.get('/', validate(listRecordsQuerySchema, 'query'), listRecordsController);

/**
 * @openapi
 * /records/export:
 *   get:
 *     tags: [Records]
 *     summary: Export records as CSV (Admin only)
 *     description: Downloads all matching records as a CSV file. Accepts the same filters as GET /records (except pagination).
 *     parameters:
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [csv], default: csv }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [INCOME, EXPENSE] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema: { type: string }
 *       403:
 *         description: Forbidden — Admin only
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/export', authorize('ADMIN'), validate(exportRecordsQuerySchema, 'query'), exportRecordsController);

/**
 * @openapi
 * /records/{id}:
 *   get:
 *     tags: [Records]
 *     summary: Get record by ID (all authenticated)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Record found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     record: { $ref: '#/components/schemas/FinancialRecord' }
 *       404:
 *         description: Record not found or soft-deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   patch:
 *     tags: [Records]
 *     summary: Partial update of a record (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number, example: 6000.00 }
 *               type: { type: string, enum: [INCOME, EXPENSE] }
 *               category: { type: string }
 *               date: { type: string, format: date-time }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Record updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     record: { $ref: '#/components/schemas/FinancialRecord' }
 *       404:
 *         description: Record not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   delete:
 *     tags: [Records]
 *     summary: Soft delete a record (Admin only)
 *     description: Sets isDeleted=true. Record is hidden from all queries but preserved in the database.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Record soft-deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     record: { $ref: '#/components/schemas/FinancialRecord' }
 *       404:
 *         description: Record not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/:id', validate(uuidParamSchema, 'params'), getRecordByIdController);
router.patch('/:id', authorize('ADMIN'), validate(uuidParamSchema, 'params'), validate(updateRecordSchema), updateRecordController);
router.delete('/:id', authorize('ADMIN'), validate(uuidParamSchema, 'params'), softDeleteRecordController);

export default router;
