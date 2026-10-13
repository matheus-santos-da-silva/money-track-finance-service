import { Prisma } from "@prisma/client";
import { Test, TestingModule } from "@nestjs/testing";
import { toCalendarDate } from "src/shared/transactions/calendar-date";
import { addMonthsClamped } from "src/shared/transactions/calendar-date";
import { RECURRENCE_HORIZON_MONTHS } from "src/shared/transactions/recurrence";
import { MaterializeRecurrencesService } from "src/application/services/materialize-recurrences.service";
import { GetUserTransactionsUseCase } from "src/application/use-cases/transactions/get-user-transactions";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { RecurringSeriesRepositoryProtocol } from "src/infra/database/repositories/recurring-series/protocols/recurring-series-repository-protocol";
import { InMemoryUsersRepository } from "../in-memory-repositories/users/in-memory-users-repository";
import { InMemoryExpensesRepository } from "../in-memory-repositories/expenses/in-memory-expenses-repository";
import { InMemoryIncomesRepository } from "../in-memory-repositories/incomes/in-memory-incomes-repository";
import { InMemoryRecurringSeriesRepository } from "../in-memory-repositories/recurring-series/in-memory-recurring-series-repository";
import { recurringSeriesProvider } from "../helpers/recurring-series-provider";

const USER = "test-user-id";
const day = (value: Date) => value.toISOString().slice(0, 10);

describe("Recurring transactions generation", () => {
  let service: MaterializeRecurrencesService;
  let getTransactions: GetUserTransactionsUseCase;
  let seriesRepo: InMemoryRecurringSeriesRepository;
  let expenses: InMemoryExpensesRepository;
  let incomes: InMemoryIncomesRepository;

  const newSeries = (over: Record<string, unknown> = {}) =>
    seriesRepo.createWithFirstOccurrence({
      user_id: USER,
      kind: "EXPENSE",
      frequency: "MONTHLY",
      anchor_date: toCalendarDate("2026-01-31"),
      category_id: "test-category-id",
      amount: new Prisma.Decimal(100),
      description: "aluguel",
      ...over,
    } as any);

  const expenseDays = () => expenses.expenses.map((e) => day(e.transaction_date)).sort();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterializeRecurrencesService,
        GetUserTransactionsUseCase,
        { provide: UsersRepositoryProtocol, useClass: InMemoryUsersRepository },
        { provide: ExpensesRepositoryProtocol, useClass: InMemoryExpensesRepository },
        { provide: IncomesRepositoryProtocol, useClass: InMemoryIncomesRepository },
        recurringSeriesProvider,
      ],
    }).compile();

    service = module.get(MaterializeRecurrencesService);
    getTransactions = module.get(GetUserTransactionsUseCase);
    seriesRepo = module.get(RecurringSeriesRepositoryProtocol);
    expenses = module.get(ExpensesRepositoryProtocol);
    incomes = module.get(IncomesRepositoryProtocol);

    await module.get<UsersRepositoryProtocol>(UsersRepositoryProtocol).create(USER, "PREMIUM", new Date());
  });

  it("should generate the missing occurrences up to the end of the requested period", async () => {
    await newSeries();

    await service.run(USER, toCalendarDate("2026-05-31"));

    expect(expenseDays()).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
      "2026-05-31",
    ]);
    expect(day(seriesRepo.series[0].generated_until)).toBe("2026-05-31");
  });

  it("should copy the series template into each generated occurrence", async () => {
    await newSeries();

    await service.run(USER, toCalendarDate("2026-03-31"));

    const [, feb] = expenses.expenses.sort((a, b) => +a.transaction_date - +b.transaction_date);
    expect(feb).toMatchObject({
      user_id: USER,
      category_id: "test-category-id",
      description: "aluguel",
      recurrence: "MONTHLY",
      total_installments: 1,
    });
    expect(Number(feb.amount)).toBe(100);
    expect(feb.recurrence_series_id).toBe(seriesRepo.series[0].id);
  });

  it("should be idempotent: running twice does not duplicate occurrences", async () => {
    await newSeries();

    await service.run(USER, toCalendarDate("2026-04-30"));
    await service.run(USER, toCalendarDate("2026-04-30"));

    expect(expenses.expenses).toHaveLength(4);
  });

  it("should not do anything for a period that is already generated", async () => {
    await newSeries();
    await service.run(USER, toCalendarDate("2026-06-30"));
    const appendSpy = jest.spyOn(seriesRepo, "appendOccurrences");

    await service.run(USER, toCalendarDate("2026-03-31"));

    expect(appendSpy).not.toHaveBeenCalled();
  });

  it("should not bring back an occurrence the user deleted", async () => {
    await newSeries();
    await service.run(USER, toCalendarDate("2026-04-30"));
    const march = expenses.expenses.find((e) => day(e.transaction_date) === "2026-03-31");
    await expenses.delete(march.id);

    await service.run(USER, toCalendarDate("2026-06-30"));

    expect(expenseDays()).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-04-30",
      "2026-05-31",
      "2026-06-30",
    ]);
  });

  it("should generate yearly series keeping day and month", async () => {
    await newSeries({ frequency: "YEARLY", anchor_date: toCalendarDate("2028-02-29") });

    // "agora" fixo em 2031: o teto à frente de hoje não limita o teste
    await service.run(USER, toCalendarDate("2031-12-31"), new Date("2031-06-01T00:00:00Z"));

    expect(expenseDays()).toEqual(["2028-02-29", "2029-02-28", "2030-02-28", "2031-02-28"]);
  });

  it("should never generate more than RECURRENCE_HORIZON_MONTHS ahead of today", async () => {
    await newSeries({ anchor_date: toCalendarDate("2026-01-31") });
    const limit = addMonthsClamped(new Date(), RECURRENCE_HORIZON_MONTHS);

    await service.run(USER, toCalendarDate("2045-12-31"));

    const last = expenses.expenses
      .map((e) => e.transaction_date)
      .sort((a, b) => +a - +b)
      .pop();
    expect(last.getTime()).toBeLessThanOrEqual(limit.getTime());
    // e foi até perto do limite (não parou antes)
    expect(limit.getTime() - last.getTime()).toBeLessThan(32 * 86_400_000);
  });

  it("should skip stopped series", async () => {
    await newSeries();
    seriesRepo.series[0].active = false;

    await service.run(USER, toCalendarDate("2026-06-30"));

    expect(expenses.expenses).toHaveLength(1);
  });

  it("should only generate the series of the requesting user", async () => {
    await newSeries();
    await newSeries({ user_id: "another-user-id" });

    await service.run(USER, toCalendarDate("2026-03-31"));

    const others = expenses.expenses.filter((e) => e.user_id === "another-user-id");
    expect(others).toHaveLength(1);
  });

  it("should generate income series too", async () => {
    await newSeries({ kind: "INCOME" });

    await service.run(USER, toCalendarDate("2026-03-31"));

    expect(incomes.incomes.map((i) => day(i.transaction_date)).sort()).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
    ]);
  });

  describe("GET transactions", () => {
    it("should include the generated occurrences of the requested month", async () => {
      await newSeries({ anchor_date: toCalendarDate("2026-01-15") });

      const result = await getTransactions.find({
        user_id: USER,
        start_date: new Date("2026-04-01"),
        end_date: new Date("2026-04-30"),
      });

      expect(result.expenses.map((e) => day(e.transaction_date))).toEqual(["2026-04-15"]);
    });

    it("should not generate anything when no period is requested", async () => {
      await newSeries();

      await getTransactions.find({ user_id: USER });

      expect(expenses.expenses).toHaveLength(1);
    });
  });
});
