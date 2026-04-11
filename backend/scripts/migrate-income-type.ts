/**
 * One-time migration: backfill `type` field from the old `isIncome` boolean.
 *
 * Run with:  npx ts-node scripts/migrate-income-type.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Update income records (isIncome = true → type = "income")
  const incomeResult = await prisma.expense.updateMany({
    where: { isIncome: true } as never,
    data: { type: "income" } as never,
  });

  // Update expense records (isIncome = false or missing → type = "expense")
  const expenseResult = await prisma.expense.updateMany({
    where: { OR: [{ isIncome: false }, { isIncome: { isSet: false } }] } as never,
    data: { type: "expense" } as never,
  });

  console.log(`Migrated ${incomeResult.count} income records`);
  console.log(`Migrated ${expenseResult.count} expense records`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
