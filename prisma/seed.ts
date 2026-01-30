import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { CategoryType } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const defaultCategories = [
  { name: "Alimentação", icon: "#E67171-food", type: CategoryType.EXPENSE },
  { name: "Transporte", icon: "#FFA500-transport", type: CategoryType.EXPENSE },
  { name: "Moradia", icon: "#08a4a7-home", type: CategoryType.EXPENSE },
  { name: "Lazer", icon: "#FF91A4-leisure", type: CategoryType.EXPENSE },
  { name: "Salário", icon: "#53D253-wage", type: CategoryType.INCOME },
  {
    name: "Renda Extra",
    icon: "#135313-extraincome",
    type: CategoryType.INCOME,
  },
  { name: "Viagem", icon: "#9D00FF-travel", type: CategoryType.EXPENSE },
  {
    name: "Investimento",
    icon: "#FFA500-investment",
    type: CategoryType.EXPENSE,
  },
  { name: "Educação", icon: "#895129-education", type: CategoryType.EXPENSE },
  {
    name: "Assinaturas",
    icon: "#111184-subscriptions",
    type: CategoryType.EXPENSE,
  },
  { name: "Saúde", icon: "#56BFFF-health", type: CategoryType.EXPENSE },
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
