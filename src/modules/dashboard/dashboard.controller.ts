import { Request, Response, NextFunction } from 'express';
import { getFinancialSummary, getCategoryBreakdown, getMonthlyTrends, getRecentActivity } from './dashboard.service';
import { sendSuccess } from '../../utils/apiResponse';

export const getFinancialSummaryController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const summary = await getFinancialSummary();
    sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
};

export const getCategoryBreakdownController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await getCategoryBreakdown();
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getMonthlyTrendsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const months = req.query['months'] ? Number(req.query['months']) : 6;
    const result = await getMonthlyTrends(months);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getRecentActivityController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const limit = req.query['limit'] ? Number(req.query['limit']) : 10;
    const result = await getRecentActivity(limit);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
