import * as request from "supertest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AppModule } from "../../../src/app.module";
import { PrismaService } from "src/infra/database/config/prisma.service";
import { getTestAuthToken } from "src/shared/utils/test-auth";
import { CreateIncomeInputMock } from "../../mocks/incomes/create-income-input-mock";

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
      .send({ ...CreateIncomeInputMock, category_id: "test-category-income" })
      .set("Authorization", `Bearer ${testToken}`)
      .expect(201);
  });

  it("should return 401 status code when token is not provided", async () => {
    await request(app.getHttpServer())
      .post("/incomes")
      .send({ ...CreateIncomeInputMock, category_id: "test-category-income" })
      .expect(401);
  });

  it("should return 401 status code when the token is invalid", async () => {
    await request(app.getHttpServer())
      .post("/incomes")
      .set("Authorization", `Bearer invalid-token`)
      .send({ ...CreateIncomeInputMock, category_id: "test-category-income" })
      .expect(401);
  });

  it("should return 401 status code when the token-id is different of user-id", async () => {
    await request(app.getHttpServer())
      .post("/incomes")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ ...CreateIncomeInputMock, user_id: "invalid-user-id" })
      .expect(401);
  });

  it("should return 400 status code when the category not exists", async () => {
    await request(app.getHttpServer())
      .post("/incomes")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ ...CreateIncomeInputMock, category_id: "invalid-category" })
      .expect(400);
  });
});
