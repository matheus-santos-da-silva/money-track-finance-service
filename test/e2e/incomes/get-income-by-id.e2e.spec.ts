import request from "supertest";
import { AppModule } from "../../../src/app.module";
import { PrismaService } from "src/infra/database/config/prisma.service";
import { INestApplication } from "@nestjs/common";
import { getTestAuthToken } from "../../helpers/test-auth";
import { Test, TestingModule } from "@nestjs/testing";
import { CreateIncomeBodyMock } from "../../mocks/incomes/create-income-input-mock";

describe("Get Income By Id Controller (e2e) - (Get /incomes/:id)", () => {
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

  it("should return status code 200 when get a income", async () => {
    const { body } = await request(app.getHttpServer())
      .post("/incomes")
      .send({ ...CreateIncomeBodyMock, transaction_date: "2026-10-05", category_id: "test-category-income" })
      .set("Authorization", `Bearer ${testToken}`);

    await request(app.getHttpServer())
      .get(`/incomes/${body.id}`)
      .set("Authorization", `Bearer ${testToken}`)
      .expect(200);
  });

  it("should return status code 400 when income not exists", async () => {
    await request(app.getHttpServer())
      .get(`/incomes/invalid-id`)
      .set("Authorization", `Bearer ${testToken}`)
      .expect(400);
  });
});
