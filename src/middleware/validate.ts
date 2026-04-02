import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';

/**
 * Generic validation middleware.
 * Parses and coerces the target (body/query/params) against the provided Zod schema.
 * On parse failure, forwards the ZodError to the global error handler via next(err)
 * so all error formatting stays in one place (errorHandler.ts).
 */
export const validate =
  (schema: ZodTypeAny, target: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (err) {
      // Forward to global errorHandler — handles ZodError, unknown errors, etc.
      next(err);
    }
  };
