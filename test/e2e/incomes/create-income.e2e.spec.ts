import request from "supertest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AppModule } from "../../../src/app.module";
import { PrismaService } from "src/infra/database/config/prisma.service";
import { getTestAuthToken } from "../../helpers/test-auth";
import { CreateIncomeBodyMock } from "../../mocks/incomes/create-income-input-mock";

describe("Create Income Controller (e2e) - (POST /incomes)", () => {
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
    await prismaService.income.deleteMany({});
  });

  it("should return status code 201 when creating an income", async () => {
    await request(app.getHttpServer())
      .post("/incomes")
      .send({ ...CreateIncomeBodyMock, transaction_date: "2026-10-05", category_id: "test-category-income" })
      .set("Authorization", `Bearer ${testToken}`)
      .expect(201);
  });

  it("should return 401 status code when token is not provided", async () => {
    await request(app.getHttpServer())
      .post("/incomes")
      .send({ ...CreateIncomeBodyMock, transaction_date: "2026-10-05", category_id: "test-category-income" })
      .expect(401);
  });

  it("should return 401 status code when the token is invalid", async () => {
    await request(app.getHttpServer())
      .post("/incomes")
      .set("Authorization", `Bearer invalid-token`)
      .send({ ...CreateIncomeBodyMock, transaction_date: "2026-10-05", category_id: "test-category-income" })
      .expect(401);
  });

  it("should return 400 status code when the body tries to set the owner (user_id)", async () => {
    await request(app.getHttpServer())
      .post("/incomes")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ ...CreateIncomeBodyMock, transaction_date: "2026-10-05", category_id: "test-category-income", user_id: "other-user-id" })
      .expect(400);
  });

  it("should return 400 status code when the category not exists", async () => {
    await request(app.getHttpServer())
      .post("/incomes")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ ...CreateIncomeBodyMock, transaction_date: "2026-10-05", category_id: "invalid-category" })
      .expect(400);
  });
});
