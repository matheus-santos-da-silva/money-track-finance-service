import request from "supertest";
import { AppModule } from "../../../src/app.module";
import { PrismaService } from "src/infra/database/config/prisma.service";
import { INestApplication } from "@nestjs/common";
import { getTestAuthToken } from "../../helpers/test-auth";
import { Test, TestingModule } from "@nestjs/testing";

describe("Get User Transactions Controller (e2e) - (GET /transactions)", () => {
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

  it("should return status code 200 when get will be success", async () => {
    await request(app.getHttpServer())
      .get("/transactions")
      .set("Authorization", `Bearer ${testToken}`)
      .expect(200);
  });

  it("should return 401 status code when token is not provided", async () => {
    await request(app.getHttpServer())
      .get("/transactions")
      .expect(401);
  });

  it("should return 401 status code when the token is invalid", async () => {
    await request(app.getHttpServer())
      .get("/transactions")
      .set("Authorization", `Bearer invalid-token`)
      .expect(401);
  });

  it("should return 400 status code when the user gives just a one date parameter", async () => {
    await request(app.getHttpServer())
      .get("/transactions?start_date=2025-05-29")
      .set("Authorization", `Bearer ${testToken}`)
      .expect(400);
  });
});
