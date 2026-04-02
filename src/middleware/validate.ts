import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';

/**
 * Generic validation middleware.
 * Parses and coerces the target (body/query/params) against the provided Zod schema.
 * Uses Object.defineProperty to safely override req.query / req.params in Express 5,
 * where those are prototype getters and cannot be set via direct assignment.
 * On parse failure, forwards the ZodError to the global error handler via next(err).
 */
export const validate =
  (schema: ZodTypeAny, target: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      // Use defineProperty so we own-shadow Express 5's prototype getter for query/params
      Object.defineProperty(req, target, {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      next();
    } catch (err) {
      next(err);
    }
  };
