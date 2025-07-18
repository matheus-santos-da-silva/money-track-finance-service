import { Decimal } from "@prisma/client/runtime/library";

export const CreatedExpenseMock = {
  id: "test-expense-id",
  category_id: "test-category-id",
  description: "Test Expense",
  amount: new Decimal(200),
  total_installments: 1,
};
