import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export const getFinancialSummary = async () => {
  const [incomeAgg, expenseAgg, recordCount] = await prisma.$transaction([
    prisma.financialRecord.aggregate({
      where: { type: 'INCOME', isDeleted: false },
      _sum: { amount: true },
    }),
    prisma.financialRecord.aggregate({
      where: { type: 'EXPENSE', isDeleted: false },
      _sum: { amount: true },
    }),
    prisma.financialRecord.count({
      where: { isDeleted: false },
    }),
  ]);

  const totalIncome = Number(incomeAgg._sum.amount ?? 0);
  const totalExpenses = Number(expenseAgg._sum.amount ?? 0);
  const netBalance = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    recordCount,
  };
};

export const getCategoryBreakdown = async () => {
  // Use raw SQL for GROUP BY category + type — Prisma groupBy doesn't aggregate across two columns cleanly
  const rows = await prisma.$queryRaw<
    Array<{ category: string; type: string; total: Prisma.Decimal; count: bigint }>
  >(
    Prisma.sql`
      SELECT
        category,
        type,
        SUM(amount)   AS total,
        COUNT(*)::bigint AS count
      FROM "FinancialRecord"
      WHERE "isDeleted" = false
      GROUP BY category, type
      ORDER BY type, total DESC
    `,
  );

  return {
    categories: rows.map((r) => ({
      category: r.category,
      type: r.type,
      total: Number(r.total),
      count: Number(r.count),
    })),
  };
};
