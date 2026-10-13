import request from "supertest";
import { AppModule } from "../../../src/app.module";
import { PrismaService } from "src/infra/database/config/prisma.service";
import { INestApplication } from "@nestjs/common";
import { getTestAuthToken } from "../../helpers/test-auth";
import { Test, TestingModule } from "@nestjs/testing";

describe("Get Categories Controller (e2e) - (Get /categories)", () => {
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

  it("should return status code 200 when return categories successfully", async () => {
    await request(app.getHttpServer())
      .get("/categories")
      .set("Authorization", `Bearer ${testToken}`)
      .expect(200);
  });

  it("should return 401 status code when token is not provided", async () => {
    const { body } = await request(app.getHttpServer())
      .get("/categories")
      .expect(401);

    expect(body.message).toBe("Token não fornecido");
  });
});
