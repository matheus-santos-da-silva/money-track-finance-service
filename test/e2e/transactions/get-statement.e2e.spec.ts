import request from "supertest";
import { AppModule } from "../../../src/app.module";
import { PrismaService } from "src/infra/database/config/prisma.service";
import { toCalendarDate } from "src/shared/transactions/calendar-date";
import { getTestAuthToken } from "../../helpers/test-auth";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";

const USER_ID = "test-user-id";
const OTHER_USER_ID = "statement-other-user-id";
const PERIOD = "start_date=2026-10-01&end_date=2026-10-31";

const row = (
  id: string,
  day: string,
  amount: number,
  extra: Record<string, unknown> = {},
) => ({
  id,
  user_id: USER_ID,
  amount,
  transaction_date: toCalendarDate(day),
  ...extra,
});

const expense = (...args: Parameters<typeof row>) => ({
  category_id: "test-category-expense",
  ...row(...args),
});

const income = (...args: Parameters<typeof row>) => ({
  category_id: "test-category-income",
  ...row(...args),
});

const EXPENSES = [
  expense("st-e1", "2026-10-13", 236.9, { description: "Mercado" }),
  expense("st-e2", "2026-10-13", 15),
  expense("st-e3", "2026-10-10", 39.9, {
    description: "Streaming",
    recurrence: "MONTHLY",
  }),
  expense("st-e4", "2026-10-10", 120, {
    description: "Tênis de corrida",
    total_installments: 6,
    current_installment: 2,
    installment_group_id: "st-group",
  }),
  expense("st-e5", "2026-10-05", 1400, { description: "Aluguel" }),
  // Fora do período consultado.
  expense("st-e6", "2026-11-02", 50),
  { ...expense("st-e7", "2026-10-13", 999), user_id: OTHER_USER_ID },
];

const INCOMES = [
  income("st-i1", "2026-10-05", 4500, {
    description: "Salário",
    recurrence: "MONTHLY",
  }),
  income("st-i2", "2026-10-13", 100, { description: "Freela" }),
  income("st-i3", "2026-10-01", 250),
];

// Mais recentes primeiro; no mesmo dia, despesas antes de receitas.
const BY_DATE_DESC = [
  "st-e2",
  "st-e1",
  "st-i2",
  "st-e4",
  "st-e3",
  "st-e5",
  "st-i1",
  "st-i3",
];

describe("Get Statement Controller (e2e) - (GET /transactions/statement)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let testToken: string;

  const get = (query: string) =>
    request(app.getHttpServer())
      .get(`/transactions/statement?${query}`)
      .set("Authorization", `Bearer ${testToken}`);

  const idsOf = (body: { items: { id: string }[] }) =>
    body.items.map(({ id }) => id);

  // Percorre todas as páginas seguindo o cursor.
  const allPages = async (query: string) => {
    const ids: string[] = [];
    let cursor: string | null = null;

    do {
      const { body } = await get(
        cursor ? `${query}&cursor=${cursor}` : query,
      ).expect(200);

      ids.push(...idsOf(body));
      cursor = body.next_cursor;
    } while (cursor);

    return ids;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mesmas opções do main.ts: a query string depende do transform.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    testToken = getTestAuthToken(USER_ID);

    await prismaService.user.create({
      data: { id: OTHER_USER_ID, trialEndsAt: new Date() },
    });
    await prismaService.expense.createMany({ data: EXPENSES });
    await prismaService.income.createMany({ data: INCOMES });
  });

  afterAll(async () => {
    const ours = { id: { startsWith: "st-" } };

    await prismaService.expense.deleteMany({ where: ours });
    await prismaService.income.deleteMany({ where: ours });
    await prismaService.user.delete({ where: { id: OTHER_USER_ID } });
    await app.close();
  });

  it("should return 401 without a token", async () => {
    await request(app.getHttpServer())
      .get(`/transactions/statement?${PERIOD}`)
      .expect(401);
  });

  it("should return 400 without the period", async () => {
    await get("start_date=2026-10-01").expect(400);
  });

  it("should return 400 for an unknown filter", async () => {
    await get(`${PERIOD}&user_id=${OTHER_USER_ID}`).expect(400);
  });

  it("should return the first page with the summary and the filtered totals", async () => {
    const { body } = await get(`${PERIOD}&limit=3`).expect(200);

    expect(idsOf(body)).toEqual(BY_DATE_DESC.slice(0, 3));
    expect(body.next_cursor).toEqual(expect.any(String));
    expect(body.summary).toEqual({
      incomes: 4850,
      expenses: 1811.8,
      balance: 3038.2,
    });
    expect(body.filtered).toEqual({ count: 8, total: 3038.2 });
    expect(body.items[0]).toMatchObject({
      id: "st-e2",
      type: "EXPENSE",
      amount: 15,
      category_id: "test-category-expense",
      category: { name: "Test Expense Category" },
      transaction_date: "2026-10-13T12:00:00.000Z",
    });
  });

  it("should walk every page without repeating or skipping items", async () => {
    for (const limit of [1, 2, 3, 5, 100]) {
      expect(await allPages(`${PERIOD}&limit=${limit}`)).toEqual(BY_DATE_DESC);
    }
  });

  it("should return the totals only on the first page", async () => {
    const first = await get(`${PERIOD}&limit=3`).expect(200);
    const second = await get(
      `${PERIOD}&limit=3&cursor=${first.body.next_cursor}`,
    ).expect(200);

    expect(second.body.summary).toBeUndefined();
    expect(second.body.filtered).toBeUndefined();
  });

  it("should return the net total of each day of the page, even when the day continues on the next page", async () => {
    const { body } = await get(`${PERIOD}&limit=2`).expect(200);

    // A página só tem as duas despesas do dia 13, mas o total inclui a receita.
    expect(idsOf(body)).toEqual(["st-e2", "st-e1"]);
    expect(body.days).toEqual([{ date: "2026-10-13", total: -151.9 }]);
  });

  it("should sort from the oldest to the newest", async () => {
    expect(await allPages(`${PERIOD}&sort=DATE_ASC&limit=3`)).toEqual([
      "st-i3",
      "st-e5",
      "st-i1",
      "st-e3",
      "st-e4",
      "st-e1",
      "st-e2",
      "st-i2",
    ]);
  });

  it("should sort by amount across pages, without day totals", async () => {
    const byAmountDesc = [
      "st-i1",
      "st-e5",
      "st-i3",
      "st-e1",
      "st-e4",
      "st-i2",
      "st-e3",
      "st-e2",
    ];

    expect(await allPages(`${PERIOD}&sort=AMOUNT_DESC&limit=3`)).toEqual(
      byAmountDesc,
    );
    expect(await allPages(`${PERIOD}&sort=AMOUNT_ASC&limit=3`)).toEqual(
      [...byAmountDesc].reverse(),
    );

    const { body } = await get(`${PERIOD}&sort=AMOUNT_DESC`).expect(200);
    expect(body.days).toEqual([]);
  });

  it("should reject a cursor from another sort order", async () => {
    const { body } = await get(`${PERIOD}&limit=2`).expect(200);

    await get(
      `${PERIOD}&limit=2&sort=AMOUNT_DESC&cursor=${body.next_cursor}`,
    ).expect(400);
  });

  it("should filter by type", async () => {
    const { body } = await get(`${PERIOD}&type=INCOME`).expect(200);

    expect(idsOf(body)).toEqual(["st-i2", "st-i1", "st-i3"]);
    expect(body.filtered).toEqual({ count: 3, total: 4850 });
    // O resumo continua sendo do período inteiro.
    expect(body.summary.expenses).toBe(1811.8);
  });

  it("should filter by category", async () => {
    const { body } = await get(
      `${PERIOD}&category_ids=test-category-income,unknown-category`,
    ).expect(200);

    expect(idsOf(body)).toEqual(["st-i2", "st-i1", "st-i3"]);
  });

  it("should filter by amount range", async () => {
    const { body } = await get(
      `${PERIOD}&min_amount=100&max_amount=250`,
    ).expect(200);

    expect(idsOf(body)).toEqual(["st-e1", "st-i2", "st-e4", "st-i3"]);
  });

  it("should filter by mode", async () => {
    const installments = await get(`${PERIOD}&modes=INSTALLMENT`).expect(200);
    const recurring = await get(`${PERIOD}&modes=RECURRING`).expect(200);
    const both = await get(`${PERIOD}&modes=INSTALLMENT,RECURRING`).expect(200);
    const single = await get(`${PERIOD}&modes=SINGLE`).expect(200);

    expect(idsOf(installments.body)).toEqual(["st-e4"]);
    expect(idsOf(recurring.body)).toEqual(["st-e3", "st-i1"]);
    expect(idsOf(both.body)).toEqual(["st-e4", "st-e3", "st-i1"]);
    expect(idsOf(single.body)).toEqual([
      "st-e2",
      "st-e1",
      "st-i2",
      "st-e5",
      "st-i3",
    ]);
  });

  it("should search the description and the category name, ignoring case", async () => {
    const byDescription = await get(`${PERIOD}&search=MERCADO`).expect(200);
    const byCategory = await get(`${PERIOD}&search=income cat`).expect(200);

    expect(idsOf(byDescription.body)).toEqual(["st-e1"]);
    expect(byDescription.body.filtered).toEqual({ count: 1, total: -236.9 });
    expect(idsOf(byCategory.body)).toEqual(["st-i2", "st-i1", "st-i3"]);
  });

  it("should combine filters", async () => {
    const { body } = await get(
      `${PERIOD}&type=EXPENSE&modes=SINGLE&min_amount=100`,
    ).expect(200);

    expect(idsOf(body)).toEqual(["st-e1", "st-e5"]);
  });

  it("should return an empty page when nothing matches", async () => {
    const { body } = await get(`${PERIOD}&search=nada-aqui`).expect(200);

    expect(body).toMatchObject({
      items: [],
      next_cursor: null,
      days: [],
      filtered: { count: 0, total: 0 },
    });
  });
});
