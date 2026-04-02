import { z } from 'zod';

/**
 * Reusable Zod schema for routes that accept a UUID :id param.
 * Ensures invalid UUIDs are rejected with a clear 400 before reaching any DB query.
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format — must be a valid UUID'),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;
