import { Decimal } from "@prisma/client/runtime/library";
import { Recurrence } from "@prisma/client";
import { SetUTCDates } from "src/shared/utils/set-utc-dates";

export const CreateExpenseInputMock = {
  user_id: "test-user-id",
  category_id: "test-category-id",
  amount: new Decimal(200),
  total_installments: 1,
  current_installment: 1,
  recurrence: Recurrence.NONE,
  description: "Test Expense",
  transaction_date: SetUTCDates(new Date()),
};
