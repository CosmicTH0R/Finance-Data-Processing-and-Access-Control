import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { getFinancialSummaryController, getCategoryBreakdownController, getMonthlyTrendsController, getRecentActivityController } from './dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(auth);

router.get('/summary', authorize('ANALYST', 'ADMIN'), getFinancialSummaryController);
router.get('/category-summary', authorize('ANALYST', 'ADMIN'), getCategoryBreakdownController);
router.get('/trends', authorize('ANALYST', 'ADMIN'), getMonthlyTrendsController);
router.get('/recent', getRecentActivityController);

export default router;
