import { prisma } from '../../config/database';

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
