import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Operational errors thrown intentionally via AppError
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message);
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input', err.flatten().fieldErrors);
    return;
  }

  // Malformed JSON body (Express JSON parser throws SyntaxError)
  if (err instanceof SyntaxError && 'body' in err) {
    sendError(res, 400, 'BAD_REQUEST', 'Malformed JSON body');
    return;
  }

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        sendError(res, 409, 'CONFLICT', 'A record with this value already exists');
        return;
      case 'P2025':
        sendError(res, 404, 'NOT_FOUND', 'Resource not found');
        return;
      case 'P2023':
        // Invalid UUID or malformed ID value passed to Prisma
        sendError(res, 400, 'BAD_REQUEST', 'Invalid ID format');
        return;
      case 'P2003':
        // Foreign key constraint violation
        sendError(res, 400, 'BAD_REQUEST', 'Referenced resource does not exist');
        return;
    }
  }

  // Prisma query validation errors (unknown field, wrong type in query)
  if (err instanceof Prisma.PrismaClientValidationError) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid query or data format');
    return;
  }

  // Unknown errors — log stack trace in non-test environments
  if (env.NODE_ENV !== 'test') {
    console.error('Unhandled error:', err);
  }
  sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
};
