import { Decimal } from "@prisma/client/runtime/library";

export const CreatedIncomeMock = {
  id: "test-income",
  category_id: "test-category-income",
  description: "Test Income",
  amount: new Decimal(200),
  total_installments: 1,
};
