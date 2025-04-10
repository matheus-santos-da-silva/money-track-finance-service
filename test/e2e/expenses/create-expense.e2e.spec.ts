import * as request from "supertest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AppModule } from "../../../src/app.module";
import { PrismaService } from "src/infra/database/config/prisma.service";
import { CreateExpenseInputMock } from "../../mocks/expenses/create-expense-input-mock";
import { getTestAuthToken } from "src/shared/utils/test-auth";

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
      .send(CreateExpenseInputMock)
      .set("Authorization", `Bearer ${testToken}`)
      .expect(201);
  });

  it("should return 401 status code when token is not provided", async () => {
    await request(app.getHttpServer())
      .post("/expenses")
      .send(CreateExpenseInputMock)
      .expect(401);
  });

  it("should return 401 status code when the token is invalid", async () => {
    await request(app.getHttpServer())
      .post("/expenses")
      .set("Authorization", `Bearer invalid-token`)
      .send(CreateExpenseInputMock)
      .expect(401);
  });

  it("should return 401 status code when the token-id is different of user-id", async () => {
    await request(app.getHttpServer())
      .post("/expenses")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ ...CreateExpenseInputMock, user_id: "invalid-user-id" })
      .expect(401);
  });

  it("should return 400 status code when the category not exists", async () => {
    await request(app.getHttpServer())
      .post("/expenses")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ ...CreateExpenseInputMock, category_id: "invalid-category" })
      .expect(400);
  });
});
