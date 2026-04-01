import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message);
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input', err.flatten().fieldErrors);
    return;
  }

  // Prisma unique constraint violation
  if ((err as { code?: string }).code === 'P2002') {
    sendError(res, 409, 'CONFLICT', 'A record with this value already exists');
    return;
  }

  // Prisma record not found
  if ((err as { code?: string }).code === 'P2025') {
    sendError(res, 404, 'NOT_FOUND', 'Resource not found');
    return;
  }

  console.error('Unhandled error:', err);
  sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
};
