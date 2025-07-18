import * as request from "supertest";
import { AppModule } from "../../../src/app.module";
import { PrismaService } from "../../../src/infra/database/config/prisma.service";
import { INestApplication } from "@nestjs/common";
import { getTestAuthToken } from "../../../src/shared/utils/test-auth";
import { Test, TestingModule } from "@nestjs/testing";
import { CreateExpenseCategoryInputMock } from "../../../test/mocks/categories/create-category-input-mock";

describe("Delete Category Controller (e2e) - (Delete /categories)", () => {
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

  it("should return status code 200 when delete a category successfully", async () => {
    const { body } = await request(app.getHttpServer())
      .post("/categories")
      .send(CreateExpenseCategoryInputMock)
      .set("Authorization", `Bearer ${testToken}`);

    await request(app.getHttpServer())
      .delete(`/categories/${body.id}`)
      .set("Authorization", `Bearer ${testToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/categories/${body.id}`)
      .set("Authorization", `Bearer ${testToken}`)
      .expect(400);
  });

  it("should return 401 status code when token is not provided", async () => {
    const { body } = await request(app.getHttpServer())
      .post("/categories")
      .send(CreateExpenseCategoryInputMock)
      .set("Authorization", `Bearer ${testToken}`);

    const result = await request(app.getHttpServer())
      .delete(`/categories/${body.id}`)
      .expect(401);

    expect(result.body.message).toBe("Token não fornecido");
  });

  it("should return 401 status code when the token is invalid", async () => {
    const { body } = await request(app.getHttpServer())
      .post("/categories")
      .send(CreateExpenseCategoryInputMock)
      .set("Authorization", `Bearer ${testToken}`);

    const result = await request(app.getHttpServer())
      .delete(`/categories/${body.id}`)
      .set("Authorization", `Bearer invalid-token`)
      .expect(401);

    expect(result.body.message).toBe("Token inválido");
  });
});
