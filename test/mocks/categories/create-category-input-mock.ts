import { CategoryType } from "@prisma/client";

export const CreateExpenseCategoryInputMock = {
  id: "test-category-expense",
  user_id: "test-user-id",
  type: CategoryType.EXPENSE,
  name: "Alimentação",
  icon: "icon-test",
  created_at: new Date(),
};

export const CreateIncomeCategoryInputMock = {
  id: "test-category-income",
  user_id: "test-user-id",
  type: CategoryType.INCOME,
  name: "Lazer",
  icon: "icon-test",
  created_at: new Date(),
};
