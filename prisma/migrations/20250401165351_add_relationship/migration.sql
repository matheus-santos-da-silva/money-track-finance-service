/*
  Warnings:

  - Added the required column `category_id` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category_id` to the `incomes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "category_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "incomes" ADD COLUMN     "category_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
