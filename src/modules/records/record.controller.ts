import { Request, Response, NextFunction } from 'express';
import {
  createRecord,
  listRecords,
  getRecordById,
  updateRecord,
  softDeleteRecord,
} from './record.service';
import { sendSuccess } from '../../utils/apiResponse';

export const createRecordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const record = await createRecord(req.body, req.user!.id);
    sendSuccess(res, { record }, 201, 'Record created successfully');
  } catch (error) {
    next(error);
  }
};

export const listRecordsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await listRecords(req.query as never);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getRecordByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const record = await getRecordById(req.params['id'] as string);
    sendSuccess(res, { record });
  } catch (error) {
    next(error);
  }
};

export const updateRecordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const record = await updateRecord(req.params['id'] as string, req.body);
    sendSuccess(res, { record });
  } catch (error) {
    next(error);
  }
};

export const softDeleteRecordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const record = await softDeleteRecord(req.params['id'] as string);
    sendSuccess(res, { record }, 200, 'Record deleted successfully');
  } catch (error) {
    next(error);
  }
};
