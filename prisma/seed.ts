import { PrismaClient } from "@prisma/client";
import { CategoryType } from "@prisma/client";

const prisma = new PrismaClient();

const defaultCategories = [
  { name: "Alimentação", icon: "alimentacao", type: CategoryType.EXPENSE },
  { name: "Transporte", icon: "transporte", type: CategoryType.EXPENSE },
  { name: "Moradia", icon: "moradia", type: CategoryType.EXPENSE },
  { name: "Lazer", icon: "lazer", type: CategoryType.EXPENSE },
  { name: "Salário", icon: "salario", type: CategoryType.INCOME },
  { name: "Freelance", icon: "freelance", type: CategoryType.INCOME },
];

async function seed() {
  const existingCategories = await prisma.category.findMany({
    where: { user_id: null },
  });

  if (existingCategories.length === 0) {
    await prisma.category.createMany({
      data: defaultCategories,
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
