import { Request, Response, NextFunction } from 'express';
import { getFinancialSummary, getCategoryBreakdown } from './dashboard.service';
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
