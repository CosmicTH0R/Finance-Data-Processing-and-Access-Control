import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { sendError } from '../utils/apiResponse';

export const validate =
  (schema: ZodTypeAny, target: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input', err.flatten().fieldErrors);
        return;
      }
      next(err);
    }
  };
