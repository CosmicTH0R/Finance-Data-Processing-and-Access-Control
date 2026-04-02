import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { getFinancialSummaryController, getCategoryBreakdownController } from './dashboard.controller';

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

export default router;
