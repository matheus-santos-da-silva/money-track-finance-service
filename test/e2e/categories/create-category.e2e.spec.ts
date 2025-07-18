import * as request from "supertest";
import { AppModule } from "../../../src/app.module";
import { PrismaService } from "../../../src/infra/database/config/prisma.service";
import { INestApplication } from "@nestjs/common";
import { getTestAuthToken } from "../../../src/shared/utils/test-auth";
import { Test, TestingModule } from "@nestjs/testing";
import { CreateExpenseCategoryInputMock } from "../../../test/mocks/categories/create-category-input-mock";

describe("Create Category Controller (e2e) - (Post /categories)", () => {
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

  it("should return status code 201 when create a category successfully", async () => {
    await request(app.getHttpServer())
      .post(`/categories`)
      .send(CreateExpenseCategoryInputMock)
      .set("Authorization", `Bearer ${testToken}`)
      .expect(201);
  });

  it("should return 401 status code when token is not provided", async () => {
    const { body } = await request(app.getHttpServer())
      .post("/categories")
      .expect(401);

    expect(body.message).toBe("Token não fornecido");
  });

  it("should return 401 status code when the token is invalid", async () => {
    await request(app.getHttpServer())
      .post("/categories")
      .set("Authorization", `Bearer invalid-token`)
      .send(CreateExpenseCategoryInputMock)
      .expect(401);
  });
});
