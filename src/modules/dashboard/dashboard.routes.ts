import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { getFinancialSummaryController, getCategoryBreakdownController, getMonthlyTrendsController, getRecentActivityController } from './dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(auth);

/**
 * @openapi
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Financial summary totals (Analyst + Admin)
 *     description: Returns aggregated totals across all non-deleted financial records.
 *     responses:
 *       200:
 *         description: Financial summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalIncome: { type: number, example: 52000.00 }
 *                     totalExpenses: { type: number, example: 31500.00 }
 *                     netBalance: { type: number, example: 20500.00 }
 *                     recordCount: { type: integer, example: 24 }
 *       403:
 *         description: Forbidden — Analyst or Admin only
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/summary', authorize('ANALYST', 'ADMIN'), getFinancialSummaryController);

/**
 * @openapi
 * /dashboard/category-summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Income and expense totals by category (Analyst + Admin)
 *     responses:
 *       200:
 *         description: Category breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category: { type: string, example: Salary }
 *                           type: { type: string, enum: [INCOME, EXPENSE] }
 *                           total: { type: number, example: 36000.00 }
 *                           count: { type: integer, example: 6 }
 *       403:
 *         description: Forbidden — Analyst or Admin only
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/category-summary', authorize('ANALYST', 'ADMIN'), getCategoryBreakdownController);

/**
 * @openapi
 * /dashboard/trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Monthly income/expense trends (Analyst + Admin)
 *     parameters:
 *       - in: query
 *         name: months
 *         schema: { type: integer, minimum: 1, maximum: 24, default: 6 }
 *         description: Number of past months to include
 *     responses:
 *       200:
 *         description: Monthly trends
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     trends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month: { type: string, example: "2025-06" }
 *                           income: { type: number, example: 8000 }
 *                           expenses: { type: number, example: 5000 }
 *                           net: { type: number, example: 3000 }
 *       403:
 *         description: Forbidden — Analyst or Admin only
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/trends', authorize('ANALYST', 'ADMIN'), getMonthlyTrendsController);

/**
 * @openapi
 * /dashboard/recent:
 *   get:
 *     tags: [Dashboard]
 *     summary: Most recent financial records (all authenticated)
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 10 }
 *     responses:
 *       200:
 *         description: Recent records
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
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/recent', getRecentActivityController);

export default router;
