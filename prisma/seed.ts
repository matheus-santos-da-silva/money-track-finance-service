import { PrismaClient } from "@prisma/client";
import { CategoryType } from "@prisma/client";

const prisma = new PrismaClient();

const defaultCategories = [
  { name: "Alimentação", icon: "red-food", type: CategoryType.EXPENSE },
  { name: "Transporte", icon: "orange-transport", type: CategoryType.EXPENSE },
  { name: "Moradia", icon: "cyan-home", type: CategoryType.EXPENSE },
  { name: "Lazer", icon: "pink-leisure", type: CategoryType.EXPENSE },
  { name: "Salário", icon: "lightgreen-wage", type: CategoryType.INCOME },
  {
    name: "Renda Extra",
    icon: "darkgreen-extraincome",
    type: CategoryType.INCOME,
  },
  { name: "Viagem", icon: "purple-travel", type: CategoryType.EXPENSE },
  {
    name: "Investimento",
    icon: "orange-investment",
    type: CategoryType.EXPENSE,
  },
  { name: "Educação", icon: "brown-education", type: CategoryType.EXPENSE },
  {
    name: "Assinaturas",
    icon: "darkblue-subscriptions",
    type: CategoryType.EXPENSE,
  },
  { name: "Saúde", icon: "lightblue-health", type: CategoryType.EXPENSE },
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
