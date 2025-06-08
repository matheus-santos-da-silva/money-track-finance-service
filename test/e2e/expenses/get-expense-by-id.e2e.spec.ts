import * as request from "supertest";
import { AppModule } from "../../../src/app.module";
import { PrismaService } from "src/infra/database/config/prisma.service";
import { INestApplication } from "@nestjs/common";
import { getTestAuthToken } from "src/shared/utils/test-auth";
import { Test, TestingModule } from "@nestjs/testing";
import { CreateExpenseInputMock } from "../../mocks/expenses/create-expense-input-mock";

describe("Get Expense By Id Controller (e2e) - (Get /expenses/:id)", () => {
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

  it("should return status code 200 when get a expense", async () => {
    const { body } = await request(app.getHttpServer())
      .post("/expenses")
      .send(CreateExpenseInputMock)
      .set("Authorization", `Bearer ${testToken}`);

    await request(app.getHttpServer())
      .get(`/expenses/${body.id}`)
      .set("Authorization", `Bearer ${testToken}`)
      .expect(200);
  });

  it("should return status code 400 when expense not exists", async () => {
    await request(app.getHttpServer())
      .get(`/expenses/invalid-id`)
      .set("Authorization", `Bearer ${testToken}`)
      .expect(400);
  });
});
