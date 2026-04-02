import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { getFinancialSummaryController } from './dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(auth);

/**
 * GET /api/dashboard/summary
 * Analyst + Admin — aggregated financial totals
 * Returns: totalIncome, totalExpenses, netBalance, recordCount
 */
router.get('/summary', authorize('ANALYST', 'ADMIN'), getFinancialSummaryController);

export default router;
