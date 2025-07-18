import { CategoryType } from "@prisma/client";

export const CreateExpenseCategoryInputMock = {
  id: "test-category-id",
  type: CategoryType.EXPENSE,
  name: "Alimentação",
  icon: "icon-test",
  created_at: new Date(),
};

export const CreateIncomeCategoryInputMock = {
  id: "test-category-id",
  type: CategoryType.INCOME,
  name: "Lazer",
  icon: "icon-test",
  created_at: new Date(),
};
