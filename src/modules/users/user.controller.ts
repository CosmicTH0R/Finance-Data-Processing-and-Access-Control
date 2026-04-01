import { Request, Response, NextFunction } from 'express';
import { getMe, listUsers, getUserById, updateUser, deactivateUser } from './user.service';
import { sendSuccess } from '../../utils/apiResponse';

export const getMeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await getMe(req.user!.id);
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

export const listUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await listUsers(req.query as never);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getUserByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await getUserById(req.params['id'] as string);
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

export const updateUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await updateUser(req.params['id'] as string, req.body);
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

export const deactivateUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await deactivateUser(req.params['id'] as string, req.user!.id);
    sendSuccess(res, { user }, 200, 'User deactivated successfully');
  } catch (error) {
    next(error);
  }
};
