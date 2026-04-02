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

export const getMonthlyTrends = async (months = 6) => {
  // Clamp between 1 and 24 to prevent abuse
  const clampedMonths = Math.min(Math.max(months, 1), 24);

  const rows = await prisma.$queryRaw<
    Array<{ month: string; income: Prisma.Decimal; expenses: Prisma.Decimal }>
  >(
    Prisma.sql`
      SELECT
        TO_CHAR(date, 'YYYY-MM') AS month,
        SUM(CASE WHEN type = 'INCOME'  THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) AS expenses
      FROM "FinancialRecord"
      WHERE
        "isDeleted" = false
        AND date >= DATE_TRUNC('month', NOW() - (${clampedMonths - 1} * INTERVAL '1 month'))
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month ASC
    `,
  );

  return {
    trends: rows.map((r) => {
      const income = Number(r.income);
      const expenses = Number(r.expenses);
      return {
        month: r.month,
        income,
        expenses,
        net: income - expenses,
      };
    }),
  };
};
