-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "recurrence_series_id" TEXT;

-- AlterTable
ALTER TABLE "incomes" ADD COLUMN     "recurrence_series_id" TEXT;

-- CreateTable
CREATE TABLE "recurring_series" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" "CategoryType" NOT NULL,
    "frequency" "Recurrence" NOT NULL,
    "anchor_date" TIMESTAMP(3) NOT NULL,
    "category_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "generated_until" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_series_user_id_active_idx" ON "recurring_series"("user_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_recurrence_series_id_transaction_date_key" ON "expenses"("recurrence_series_id", "transaction_date");

-- CreateIndex
CREATE UNIQUE INDEX "incomes_recurrence_series_id_transaction_date_key" ON "incomes"("recurrence_series_id", "transaction_date");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recurrence_series_id_fkey" FOREIGN KEY ("recurrence_series_id") REFERENCES "recurring_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_recurrence_series_id_fkey" FOREIGN KEY ("recurrence_series_id") REFERENCES "recurring_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

