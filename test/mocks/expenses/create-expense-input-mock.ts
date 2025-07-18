import { Recurrence } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export const CreateExpenseInputMock = {
  user_id: "test-user-id",
  category_id: "test-category-id",
  amount: new Decimal(200),
  total_installments: 1,
  recurrence: Recurrence.NONE,
  description: "Test Expense",
  transaction_date: new Date(),
};
