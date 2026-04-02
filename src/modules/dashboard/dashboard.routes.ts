import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { getFinancialSummaryController, getCategoryBreakdownController, getMonthlyTrendsController, getRecentActivityController } from './dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(auth);

/**
 * GET /api/dashboard/summary
 * Analyst + Admin — aggregated financial totals
 * Returns: totalIncome, totalExpenses, netBalance, recordCount
 */
router.get('/summary', authorize('ANALYST', 'ADMIN'), getFinancialSummaryController);

/**
 * GET /api/dashboard/category-summary
 * Analyst + Admin — totals grouped by category and type
 * Returns: categories[{ category, type, total, count }]
 */
router.get('/category-summary', authorize('ANALYST', 'ADMIN'), getCategoryBreakdownController);

/**
 * GET /api/dashboard/trends?months=6
 * Analyst + Admin — monthly income/expense/net for last N months (default 6, max 24)
 * Returns: trends[{ month, income, expenses, net }]
 */
router.get('/trends', authorize('ANALYST', 'ADMIN'), getMonthlyTrendsController);

/**
 * GET /api/dashboard/recent?limit=10
 * All authenticated — last N records ordered by date descending (default 10, max 50)
 * Returns: records[{ id, amount, type, category, date, description, createdAt, user }]
 */
router.get('/recent', getRecentActivityController);

export default router;
