import { PrismaClient } from "@prisma/client";
import { CategoryType } from "@prisma/client";

const prisma = new PrismaClient();

const testCategories = [
  {
    id: "test-category-expense",
    name: "Test Expense Category",
    icon: "test-expense",
    type: CategoryType.EXPENSE,
  },
  {
    id: "test-category-income",
    name: "Test Income Category",
    icon: "test-income",
    type: CategoryType.INCOME,
  },
];

async function seed() {
  const existingCategories = await prisma.category.findMany({
    where: { user_id: null },
  });

  if (existingCategories.length === 0) {
    await prisma.category.createMany({
      data: testCategories,
    });
    console.log("Categorias padrão criadas!");
  } else {
    console.log("Categorias padrão já existem.");
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
