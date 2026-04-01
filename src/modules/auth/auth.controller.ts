import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser } from './auth.service';
import { sendSuccess } from '../../utils/apiResponse';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await registerUser(req.body);
    sendSuccess(res, result, 201, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await loginUser(req.body);
    sendSuccess(res, result, 200, 'Login successful');
  } catch (error) {
    next(error);
  }
};
