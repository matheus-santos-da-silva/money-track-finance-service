import request from "supertest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AppModule } from "../../../src/app.module";
import { PrismaService } from "src/infra/database/config/prisma.service";
import { CreateExpenseBodyMock } from "../../mocks/expenses/create-expense-input-mock";
import { getTestAuthToken } from "../../helpers/test-auth";

describe("Create Expense Controller (e2e) - (POST /expenses)", () => {
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

  it("should return status code 201 when creating an expense", async () => {
    await request(app.getHttpServer())
      .post("/expenses")
      .send({ ...CreateExpenseBodyMock, transaction_date: "2026-10-05", category_id: "test-category-expense" })
      .set("Authorization", `Bearer ${testToken}`)
      .expect(201);
  });

  it("should create the expense for the token user", async () => {
    const response = await request(app.getHttpServer())
      .post("/expenses")
      .send({ ...CreateExpenseBodyMock, transaction_date: "2026-10-05", category_id: "test-category-expense" })
      .set("Authorization", `Bearer ${testToken}`)
      .expect(201);

    const created = await prismaService.expense.findUnique({
      where: { id: response.body.id },
    });
    expect(created?.user_id).toBe("test-user-id");
  });

  it("should return 401 status code when token is not provided", async () => {
    await request(app.getHttpServer())
      .post("/expenses")
      .send({ ...CreateExpenseBodyMock, transaction_date: "2026-10-05", category_id: "test-category-expense" })
      .expect(401);
  });

  it("should return 401 status code when the token is invalid", async () => {
    await request(app.getHttpServer())
      .post("/expenses")
      .set("Authorization", `Bearer invalid-token`)
      .send({ ...CreateExpenseBodyMock, transaction_date: "2026-10-05", category_id: "test-category-expense" })
      .expect(401);
  });

  it("should return 400 status code when the body tries to set the owner (user_id)", async () => {
    await request(app.getHttpServer())
      .post("/expenses")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ ...CreateExpenseBodyMock, transaction_date: "2026-10-05", category_id: "test-category-expense", user_id: "other-user-id" })
      .expect(400);
  });

  it("should return 400 status code when the category not exists", async () => {
    await request(app.getHttpServer())
      .post("/expenses")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ ...CreateExpenseBodyMock, transaction_date: "2026-10-05", category_id: "invalid-category" })
      .expect(400);
  });
});
