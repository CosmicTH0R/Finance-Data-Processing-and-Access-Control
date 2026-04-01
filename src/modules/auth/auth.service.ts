import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import type { RegisterInput, LoginInput } from './auth.schema';

const BCRYPT_ROUNDS = 10;

export interface AuthTokenPayload {
  id: string;
  role: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    createdAt: Date;
  };
}

export const registerUser = async (input: RegisterInput): Promise<AuthResult> => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    throw new AppError('Email already in use', 409, 'CONFLICT');
  }

  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      name: input.name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  const token = jwt.sign(
    { id: user.id, role: user.role } satisfies AuthTokenPayload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
  );

  return { token, user };
};

export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      password: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (user.status === 'INACTIVE') {
    throw new AppError('Account is deactivated. Contact an administrator.', 403, 'ACCOUNT_INACTIVE');
  }

  const passwordMatch = await bcrypt.compare(input.password, user.password);

  if (!passwordMatch) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    { id: user.id, role: user.role } satisfies AuthTokenPayload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
  );

  const { password: _password, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword };
};
