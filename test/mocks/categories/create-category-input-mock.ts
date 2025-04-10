import { CategoryType } from "@prisma/client";

export const CreateExpenseCategoryInputMock = {
  id: "test-category-expense",
  user_id: "1f200a33-463b-4325-9fb8-ee7e7b60d6b8",
  type: CategoryType.EXPENSE,
  name: "Alimentação",
  icon: "icon-test",
  created_at: new Date(),
};

export const CreateIncomeCategoryInputMock = {
  id: "test-category-income",
  user_id: "1f200a33-463b-4325-9fb8-ee7e7b60d6b8",
  type: CategoryType.INCOME,
  name: "Lazer",
  icon: "icon-test",
  created_at: new Date(),
};
