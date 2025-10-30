-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "current_installment" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "incomes" ADD COLUMN     "current_installment" INTEGER NOT NULL DEFAULT 1;
