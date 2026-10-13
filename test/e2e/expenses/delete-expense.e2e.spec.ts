import request from "supertest";
import { AppModule } from "../../../src/app.module";
import { PrismaService } from "src/infra/database/config/prisma.service";
import { INestApplication } from "@nestjs/common";
import { getTestAuthToken } from "../../helpers/test-auth";
import { Test, TestingModule } from "@nestjs/testing";
import { CreateExpenseBodyMock } from "../../mocks/expenses/create-expense-input-mock";

describe("Delete Expense Controller (e2e) - (Delete /expenses/:id)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let testToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    testToken = getTestAuthToken("test-user-id");
  });

  afterEach(async () => {
    await prismaService.expense.deleteMany({});
  });

  it("should return status code 200 when delete a expense", async () => {
    const createExpense = await request(app.getHttpServer())
      .post("/expenses")
      .send({ ...CreateExpenseBodyMock, transaction_date: "2026-10-05", category_id: "test-category-expense" })
      .set("Authorization", `Bearer ${testToken}`);

    await request(app.getHttpServer())
      .delete(`/expenses/${createExpense.body.id}`)
      .set("Authorization", `Bearer ${testToken}`)
      .expect(200);
  });

  it("should return status code 400 when expense not exists", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/expenses/invalid-id`)
      .set("Authorization", `Bearer ${testToken}`)
      .expect(400);

    expect(response.body.message).toBe("Despesa não existe!");
  });
});
