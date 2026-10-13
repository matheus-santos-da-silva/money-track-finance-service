import { Decimal } from "@prisma/client/runtime/client";
import { Recurrence } from "@prisma/client";

export const CreateIncomeInputMock = {
  user_id: "test-user-id",
  category_id: "test-category-id",
  amount: new Decimal(200),
  total_installments: 1,
  current_installment: 1,
  recurrence: Recurrence.NONE,
  description: "Test Income",
  transaction_date: new Date(),
};

// Corpo HTTP: sem dono, o servidor usa o usuário do token.
const { user_id: _userId, ...IncomeBody } = CreateIncomeInputMock;
export const CreateIncomeBodyMock = IncomeBody;
