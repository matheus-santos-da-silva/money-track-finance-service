import { Decimal } from "@prisma/client/runtime/library";

export const CreatedExpenseMock = {
  id: "984b6589-0587-4c91-838a-d33f5f6ed036",
  category_id: "test-category-expense",
  description: "Test Expense",
  amount: new Decimal(200),
  total_installments: 1,
};
