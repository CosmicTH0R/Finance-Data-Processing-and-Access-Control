import { Request, Response, NextFunction } from 'express';
import type { AuthPayload } from '../types/express';

type Role = AuthPayload['role'];

/**
 * Factory middleware for role-based access control.
 * Must be used AFTER the `auth` middleware (requires req.user to be set).
 *
 * Usage:
 *   router.post('/records', auth, authorize('ADMIN'), validate(schema), controller.create);
 */
export const authorize =
  (...allowedRoles: Role[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
