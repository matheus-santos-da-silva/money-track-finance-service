import * as request from "supertest";
import { AppModule } from "../../../src/app.module";
import { PrismaService } from "../../../src/infra/database/config/prisma.service";
import { INestApplication } from "@nestjs/common";
import { getTestAuthToken } from "../../../src/shared/utils/test-auth";
import { Test, TestingModule } from "@nestjs/testing";
import { CreateIncomeInputMock } from "../../mocks/incomes/create-income-input-mock";

describe("Delete Income Controller (e2e) - (Delete /incomes/:id)", () => {
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

  it("should return status code 200 when delete a income", async () => {
    const createIncome = await request(app.getHttpServer())
      .post("/incomes")
      .send({ ...CreateIncomeInputMock, category_id: "test-category-income" })
      .set("Authorization", `Bearer ${testToken}`);

    await request(app.getHttpServer())
      .delete(`/incomes/${createIncome.body.id}`)
      .set("Authorization", `Bearer ${testToken}`)
      .expect(200);
  });

  it("should return status code 400 when income not exists", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/incomes/invalid-id`)
      .set("Authorization", `Bearer ${testToken}`)
      .expect(400);

    expect(response.body.message).toBe("Receita não existe!");
  });
});
