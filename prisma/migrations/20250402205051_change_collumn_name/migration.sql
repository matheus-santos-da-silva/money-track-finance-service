/*
  Warnings:

  - You are about to drop the column `expense_date` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `income_date` on the `incomes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "expense_date",
ADD COLUMN     "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "incomes" DROP COLUMN "income_date",
ADD COLUMN     "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
