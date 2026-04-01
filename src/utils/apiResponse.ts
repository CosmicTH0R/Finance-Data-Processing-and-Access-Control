import { Response } from 'express';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string,
): void => {
  res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    data,
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): void => {
  const body: Record<string, unknown> = { success: false, error: { code, message } };
  if (details !== undefined) {
    (body.error as Record<string, unknown>).details = details;
  }
  res.status(statusCode).json(body);
};
