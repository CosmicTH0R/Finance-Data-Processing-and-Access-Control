import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';
import type { UpdateUserInput, ListUsersQuery } from './user.schema';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  return user;
};

export const listUsers = async (query: ListUsersQuery) => {
  const { page, limit, role, status } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(role && { role }),
    ...(status && { status }),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  return user;
};

export const updateUser = async (id: string, input: UpdateUserInput) => {
  // Ensure user exists before updating
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: input,
    select: USER_SELECT,
  });

  return updated;
};

export const deactivateUser = async (targetId: string, requesterId: string) => {
  // Edge case: admin cannot deactivate themselves
  if (targetId === requesterId) {
    throw new AppError('You cannot deactivate your own account', 400, 'SELF_DEACTIVATION');
  }

  const existing = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, status: true } });

  if (!existing) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  if (existing.status === 'INACTIVE') {
    throw new AppError('User is already inactive', 409, 'CONFLICT');
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { status: 'INACTIVE' },
    select: USER_SELECT,
  });

  return updated;
};
