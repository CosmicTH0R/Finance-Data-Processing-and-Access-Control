import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';
import type { CreateRecordInput, UpdateRecordInput, ListRecordsQuery, ExportRecordsQuery } from './record.schema';

const RECORD_SELECT = {
  id: true,
  amount: true,
  type: true,
  category: true,
  date: true,
  description: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  user: {
    select: { id: true, name: true, email: true },
  },
} as const;

export const createRecord = async (input: CreateRecordInput, userId: string) => {
  const record = await prisma.financialRecord.create({
    data: {
      amount: input.amount,
      type: input.type,
      category: input.category,
      date: new Date(input.date),
      description: input.description,
      userId,
    },
    select: RECORD_SELECT,
  });

  return record;
};

export const listRecords = async (query: ListRecordsQuery) => {
  const { type, category, startDate, endDate, page, limit, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where = {
    isDeleted: false,
    ...(type && { type }),
    ...(category && { category: { contains: category, mode: 'insensitive' as const } }),
    ...(startDate || endDate
      ? {
          date: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }
      : {}),
  };

  const [records, total] = await prisma.$transaction([
    prisma.financialRecord.findMany({
      where,
      select: RECORD_SELECT,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return {
    records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getRecordById = async (id: string) => {
  const record = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
    select: RECORD_SELECT,
  });

  if (!record) {
    throw new AppError('Record not found', 404, 'NOT_FOUND');
  }

  return record;
};

export const updateRecord = async (id: string, input: UpdateRecordInput) => {
  const existing = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError('Record not found', 404, 'NOT_FOUND');
  }

  const updated = await prisma.financialRecord.update({
    where: { id },
    data: {
      ...input,
      ...(input.date && { date: new Date(input.date) }),
    },
    select: RECORD_SELECT,
  });

  return updated;
};

export const softDeleteRecord = async (id: string) => {
  const existing = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError('Record not found', 404, 'NOT_FOUND');
  }

  const deleted = await prisma.financialRecord.update({
    where: { id },
    data: { isDeleted: true },
    select: RECORD_SELECT,
  });

  return deleted;
};

export const exportRecordsAsCsv = async (query: ExportRecordsQuery): Promise<string> => {
  const { type, category, startDate, endDate } = query;

  const where = {
    isDeleted: false,
    ...(type && { type }),
    ...(category && { category: { contains: category, mode: 'insensitive' as const } }),
    ...(startDate || endDate
      ? {
          date: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }
      : {}),
  };

  const records = await prisma.financialRecord.findMany({
    where,
    select: RECORD_SELECT,
    orderBy: { date: 'desc' },
  });

  const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const headers = ['id', 'amount', 'type', 'category', 'date', 'description', 'userId', 'userName', 'userEmail', 'createdAt', 'updatedAt'];

  const rows = records.map((r) => [
    r.id,
    r.amount.toString(),
    r.type,
    escapeCsv(r.category),
    r.date.toISOString(),
    escapeCsv(r.description ?? ''),
    r.userId,
    escapeCsv(r.user.name),
    r.user.email,
    r.createdAt.toISOString(),
    r.updatedAt.toISOString(),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
};
