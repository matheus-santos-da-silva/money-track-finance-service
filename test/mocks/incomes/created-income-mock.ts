import { Decimal } from "@prisma/client/runtime/client";

export const CreatedIncomeMock = {
  id: "test-income-id",
  category_id: "test-category-id",
  description: "Test Income",
  amount: new Decimal(200),
  total_installments: 1,
};
