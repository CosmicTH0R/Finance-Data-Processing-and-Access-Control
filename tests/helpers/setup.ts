import { prisma } from '../../src/config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';

export { prisma };

export interface TestUser {
  id: string;
  email: string;
  role: 'VIEWER' | 'ANALYST' | 'ADMIN';
  token: string;
}

let counter = 0;
const uid = () => `${Date.now()}-${++counter}`;

/**
 * Creates a user directly in the DB with a unique email + hashed password,
 * then signs and returns a valid JWT. Avoids hitting the /register endpoint
 * so tests stay independent of the auth module.
 */
export const createTestUser = async (options: {
  role?: 'VIEWER' | 'ANALYST' | 'ADMIN';
  status?: 'ACTIVE' | 'INACTIVE';
} = {}): Promise<TestUser> => {
  const role = options.role ?? 'VIEWER';

  const user = await prisma.user.create({
    data: {
      email: `${role.toLowerCase()}-${uid()}@test.com`,
      password: await bcrypt.hash('Test@1234', 10),
      name: `Test ${role}`,
      role,
      status: options.status ?? 'ACTIVE',
    },
  });

  const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: '1h',
  } as jwt.SignOptions);

  return {
    id: user.id,
    email: user.email,
    role: user.role as 'VIEWER' | 'ANALYST' | 'ADMIN',
    token,
  };
};

/**
 * Creates a test FinancialRecord linked to a user with a past date.
 */
export const createTestRecord = async (
  userId: string,
  overrides: {
    type?: 'INCOME' | 'EXPENSE';
    category?: string;
    amount?: number;
  } = {},
) =>
  prisma.financialRecord.create({
    data: {
      amount: overrides.amount ?? 1000,
      type: overrides.type ?? 'INCOME',
      category: overrides.category ?? 'Salary',
      date: new Date('2025-01-15T00:00:00.000Z'),
      description: 'Test record',
      userId,
    },
  });

/**
 * Deletes financial records and users by user IDs.
 * Use in afterAll to clean up test data without touching seed data.
 */
export const deleteUsers = async (userIds: string[]): Promise<void> => {
  if (userIds.length === 0) return;
  await prisma.financialRecord.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
};
