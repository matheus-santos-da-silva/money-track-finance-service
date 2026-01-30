import { PrismaPg } from "@prisma/adapter-pg";
import { Plan, PrismaClient } from "@prisma/client";
import { CategoryType } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const trialEndsAt = new Date(new Date());
trialEndsAt.setDate(trialEndsAt.getDate() + 7);

const testUser = {
  id: "test-user-id",
  plan: Plan.FREE,
  trialEndsAt: trialEndsAt,
};

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
  const existingUser = await prisma.user.findUnique({
    where: { id: testUser.id },
  });

  if (!existingUser) {
    await prisma.user.create({ data: testUser });
    console.log("Usuário de teste criado!");
  } else {
    console.log("Usuário de teste já existe.");
  }

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
