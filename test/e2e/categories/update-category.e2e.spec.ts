import request from "supertest";
import { AppModule } from "../../../src/app.module";
import { PrismaService } from "../../../src/infra/database/config/prisma.service";
import { INestApplication } from "@nestjs/common";
import { getTestAuthToken } from "../../helpers/test-auth";
import { Test, TestingModule } from "@nestjs/testing";
import { CreateExpenseCategoryInputMock } from "../../mocks/categories/create-category-input-mock";

describe("Update Category Controller (e2e) - (Patch /categories)", () => {
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

  it("should return status code 200 when update a category successfully", async () => {
    const { body } = await request(app.getHttpServer())
      .post("/categories")
      .send(CreateExpenseCategoryInputMock)
      .set("Authorization", `Bearer ${testToken}`);

    await request(app.getHttpServer())
      .patch(`/categories/${body.id}`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({ name: "updated-name" })
      .expect(200);

    const result = await request(app.getHttpServer())
      .get(`/categories/${body.id}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(result.body.name).toBe("updated-name");
  });

  it("should return status code 400 when body is empty", async () => {
    const { body } = await request(app.getHttpServer())
      .post("/categories")
      .send(CreateExpenseCategoryInputMock)
      .set("Authorization", `Bearer ${testToken}`);

    const result = await request(app.getHttpServer())
      .patch(`/categories/${body.id}`)
      .set("Authorization", `Bearer ${testToken}`)
      .expect(400);

    expect(result.body.message).toBe(
      "Nenhuma alteração foi requisitada, tente novamente passando alguma alteração!"
    );
  });

  it("should return 401 status code when token is not provided", async () => {
    const { body } = await request(app.getHttpServer())
      .post("/categories")
      .send(CreateExpenseCategoryInputMock)
      .set("Authorization", `Bearer ${testToken}`);

    const result = await request(app.getHttpServer())
      .patch(`/categories/${body.id}`)
      .expect(401);

    expect(result.body.message).toBe("Token não fornecido");
  });

  it("should return 401 status code when the token is invalid", async () => {
    const { body } = await request(app.getHttpServer())
      .post("/categories")
      .send(CreateExpenseCategoryInputMock)
      .set("Authorization", `Bearer ${testToken}`);

    const result = await request(app.getHttpServer())
      .patch(`/categories/${body.id}`)
      .set("Authorization", `Bearer invalid-token`)
      .expect(401);

    expect(result.body.message).toBe("Token inválido");
  });
});
