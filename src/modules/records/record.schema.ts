import { z } from 'zod';

export const createRecordSchema = z.object({
  amount: z
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be positive')
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v.toString()), {
      message: 'Amount must have at most 2 decimal places',
    }),
  type: z.enum(['INCOME', 'EXPENSE'], {
    error: 'Type must be INCOME or EXPENSE',
  }),
  category: z.string().trim().min(1, 'Category is required').max(100),
  date: z
    .string()
    .datetime({ message: 'Date must be a valid ISO 8601 datetime string' })
    .refine((d) => new Date(d) <= new Date(), { message: 'Date cannot be in the future' }),
  description: z.string().trim().max(500, 'Description must be at most 500 characters').optional(),
});

export const updateRecordSchema = z
  .object({
    amount: z
      .number({ error: 'Amount must be a number' })
      .positive('Amount must be positive')
      .refine((v) => /^\d+(\.\d{1,2})?$/.test(v.toString()), {
        message: 'Amount must have at most 2 decimal places',
      })
      .optional(),
    type: z
      .enum(['INCOME', 'EXPENSE'], {
        error: 'Type must be INCOME or EXPENSE',
      })
      .optional(),
    category: z.string().trim().min(1).max(100).optional(),
    date: z
      .string()
      .datetime({ message: 'Date must be a valid ISO 8601 datetime string' })
      .refine((d) => new Date(d) <= new Date(), { message: 'Date cannot be in the future' })
      .optional(),
    description: z.string().trim().max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const listRecordsQuerySchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default(1),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((n) => n <= 100, { message: 'Limit cannot exceed 100' })
    .default(20),
  sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type ListRecordsQuery = z.infer<typeof listRecordsQuerySchema>;

export const exportRecordsQuerySchema = z.object({
  format: z.enum(['csv']).default('csv'),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type ExportRecordsQuery = z.infer<typeof exportRecordsQuerySchema>;
