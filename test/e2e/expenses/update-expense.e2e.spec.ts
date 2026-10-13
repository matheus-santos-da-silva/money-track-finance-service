import request from "supertest";
import { AppModule } from "../../../src/app.module";
import { PrismaService } from "src/infra/database/config/prisma.service";
import { INestApplication } from "@nestjs/common";
import { getTestAuthToken } from "../../helpers/test-auth";
import { Test, TestingModule } from "@nestjs/testing";
import { CreateExpenseBodyMock } from "../../mocks/expenses/create-expense-input-mock";

describe("Update Expense Controller (e2e) - (Patch /expenses/:id)", () => {
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

  it("should return status code 200 when update a expense", async () => {
    const createExpense = await request(app.getHttpServer())
      .post("/expenses")
      .send({ ...CreateExpenseBodyMock, transaction_date: "2026-10-05", category_id: "test-category-expense" })
      .set("Authorization", `Bearer ${testToken}`);

    await request(app.getHttpServer())
      .patch(`/expenses/${createExpense.body.id}`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({ description: "updated-description" })
      .expect(200);
  });

  it("should return status code 400 when expense not exists", async () => {
    const { body } = await request(app.getHttpServer())
      .patch(`/expenses/invalid-id`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({ description: "updated-description" })
      .expect(400);

    expect(body.message).toBe("Despesa não existe!");
  });

  it("should return status code 400 when body is empty", async () => {
    const createExpense = await request(app.getHttpServer())
      .post("/expenses")
      .send(CreateExpenseBodyMock)
      .set("Authorization", `Bearer ${testToken}`);

    const { body } = await request(app.getHttpServer())
      .patch(`/expenses/${createExpense.body.id}`)
      .set("Authorization", `Bearer ${testToken}`)
      .expect(400);

    expect(body.message).toBe(
      "Nenhuma alteração foi requisitada, tente novamente passando alguma alteração!"
    );
  });
});
