/*
  Warnings:

  - Made the column `total_installments` on table `expenses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `total_installments` on table `incomes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "total_installments" SET NOT NULL;

-- AlterTable
ALTER TABLE "incomes" ALTER COLUMN "total_installments" SET NOT NULL;
