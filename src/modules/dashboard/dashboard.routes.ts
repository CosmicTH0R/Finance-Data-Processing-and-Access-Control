import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { getFinancialSummaryController, getCategoryBreakdownController, getMonthlyTrendsController, getRecentActivityController } from './dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(auth);

// GET /api/dashboard/summary — Analyst + Admin, aggregated financial totals (income, expenses, net, count)
router.get('/summary', authorize('ANALYST', 'ADMIN'), getFinancialSummaryController);

// GET /api/dashboard/category-summary — Analyst + Admin, totals grouped by category and type
router.get('/category-summary', authorize('ANALYST', 'ADMIN'), getCategoryBreakdownController);

// GET /api/dashboard/trends?months=6 — Analyst + Admin, monthly income/expense/net for last N months (max 24)
router.get('/trends', authorize('ANALYST', 'ADMIN'), getMonthlyTrendsController);

// GET /api/dashboard/recent?limit=10 — all authenticated, last N records ordered by date desc (max 50)
router.get('/recent', getRecentActivityController);

export default router;
