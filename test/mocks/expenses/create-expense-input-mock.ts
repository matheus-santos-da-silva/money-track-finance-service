import { Decimal } from "@prisma/client/runtime/client";
import { Recurrence } from "@prisma/client";
import { toCalendarDate } from "src/shared/transactions/calendar-date";

export const CreateExpenseInputMock = {
  user_id: "test-user-id",
  category_id: "test-category-id",
  amount: new Decimal(200),
  total_installments: 1,
  current_installment: 1,
  recurrence: Recurrence.NONE,
  description: "Test Expense",
  transaction_date: toCalendarDate(new Date()),
};

// Corpo HTTP: sem dono, o servidor usa o usuário do token.
const { user_id: _userId, ...ExpenseBody } = CreateExpenseInputMock;
export const CreateExpenseBodyMock = ExpenseBody;
