import { GetStatementUseCase } from "src/application/use-cases/transactions/get-statement";
import { GetStatementQueryDTO } from "src/domain/DTO/transactions/get-statement-query-DTO";
import { StatementItemDTO } from "src/domain/DTO/transactions/get-statement-response-DTO";
import {
  decodeCursor,
  encodeCursor,
  StatementSort,
  StatementType,
} from "src/shared/transactions/statement";

const USER_ID = "test-user-id";

const item = (id: string, day: string): StatementItemDTO => ({
  id,
  type: StatementType.EXPENSE,
  amount: 10,
  description: null,
  category_id: "test-category-id",
  category: { name: "Mercado", icon: "#4CAF50-food" },
  total_installments: 1,
  current_installment: 1,
  installment_group_id: null,
  recurrence: "NONE",
  transaction_date: new Date(`${day}T12:00:00.000Z`),
});

const query = (overrides: Partial<GetStatementQueryDTO> = {}) =>
  ({
    start_date: "2026-10-01",
    end_date: "2026-10-31",
    sort: StatementSort.DATE_DESC,
    limit: 2,
    ...overrides,
  }) as GetStatementQueryDTO;

describe("Get Statement UseCase", () => {
  const statementRepository = {
    findPage: jest.fn(),
    totals: jest.fn(),
    dayTotals: jest.fn(),
  };
  const usersRepository = { find: jest.fn() };
  const materializeRecurrences = { run: jest.fn() };

  const useCase = new GetStatementUseCase(
    statementRepository as any,
    usersRepository as any,
    materializeRecurrences as any,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    usersRepository.find.mockResolvedValue({ id: USER_ID });
    statementRepository.findPage.mockResolvedValue([]);
    statementRepository.dayTotals.mockResolvedValue([]);
    statementRepository.totals.mockResolvedValue({
      incomes: 0,
      expenses: 0,
      count: 0,
    });
  });

  it("should query the whole calendar days of the period", async () => {
    await useCase.find(USER_ID, query());

    const [filters, sort, cursor, take] =
      statementRepository.findPage.mock.calls[0];

    expect(filters).toMatchObject({
      user_id: USER_ID,
      start_date: new Date("2026-10-01T00:00:00.000Z"),
      end_date: new Date("2026-10-31T23:59:59.999Z"),
    });
    expect(sort).toEqual({ field: "transaction_date", direction: "desc" });
    expect(cursor).toBeNull();
    // Um item além do limite, para saber se existe próxima página.
    expect(take).toBe(3);
  });

  it("should generate the missing recurring occurrences up to the end of the period", async () => {
    await useCase.find(USER_ID, query());

    expect(materializeRecurrences.run).toHaveBeenCalledWith(
      USER_ID,
      new Date("2026-10-31T23:59:59.999Z"),
    );
  });

  it("should return a cursor for the last item when there is a next page", async () => {
    statementRepository.findPage.mockResolvedValue([
      item("e1", "2026-10-13"),
      item("e2", "2026-10-10"),
      item("e3", "2026-10-05"),
    ]);

    const { items, next_cursor } = await useCase.find(USER_ID, query());

    expect(items.map(({ id }) => id)).toEqual(["e1", "e2"]);
    expect(decodeCursor(next_cursor, StatementSort.DATE_DESC)).toMatchObject({
      id: "e2",
      type: "EXPENSE",
    });
  });

  it("should return a null cursor on the last page", async () => {
    statementRepository.findPage.mockResolvedValue([item("e1", "2026-10-13")]);

    const { next_cursor } = await useCase.find(USER_ID, query());

    expect(next_cursor).toBeNull();
  });

  it("should return the period summary and the filtered totals on the first page", async () => {
    statementRepository.totals
      .mockResolvedValueOnce({ incomes: 4850, expenses: 3012.4, count: 9 })
      .mockResolvedValueOnce({ incomes: 0, expenses: 236.9, count: 1 });

    const { summary, filtered } = await useCase.find(
      USER_ID,
      query({ type: StatementType.EXPENSE, search: "mercado" }),
    );

    const [periodFilters] = statementRepository.totals.mock.calls[0];
    const [allFilters] = statementRepository.totals.mock.calls[1];

    // O resumo é do período inteiro; busca e tipo não entram.
    expect(periodFilters).not.toHaveProperty("search");
    expect(periodFilters).not.toHaveProperty("type");
    expect(allFilters).toMatchObject({ type: "EXPENSE", search: "mercado" });

    expect(summary).toEqual({ incomes: 4850, expenses: 3012.4, balance: 1837.6 });
    expect(filtered).toEqual({ count: 1, total: -236.9 });
  });

  it("should not recalculate the totals on the following pages", async () => {
    const cursor = encodeCursor(StatementSort.DATE_DESC, item("e2", "2026-10-10"));

    const response = await useCase.find(USER_ID, query({ cursor }));

    expect(statementRepository.totals).not.toHaveBeenCalled();
    expect(response.summary).toBeUndefined();
    expect(response.filtered).toBeUndefined();
    expect(statementRepository.findPage.mock.calls[0][2]).toMatchObject({
      id: "e2",
    });
  });

  it("should ask the day totals for the days covered by the page", async () => {
    statementRepository.findPage.mockResolvedValue([
      item("e1", "2026-10-13"),
      item("e2", "2026-10-10"),
    ]);
    statementRepository.dayTotals.mockResolvedValue([
      { date: "2026-10-13", total: -251.9 },
    ]);

    const { days } = await useCase.find(
      USER_ID,
      query({ search: "mercado" }),
    );

    expect(statementRepository.dayTotals).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "mercado",
        start_date: new Date("2026-10-10T00:00:00.000Z"),
        end_date: new Date("2026-10-13T23:59:59.999Z"),
      }),
    );
    expect(days).toEqual([{ date: "2026-10-13", total: -251.9 }]);
  });

  it("should not return day totals when sorting by amount", async () => {
    statementRepository.findPage.mockResolvedValue([item("e1", "2026-10-13")]);

    const { days } = await useCase.find(
      USER_ID,
      query({ sort: StatementSort.AMOUNT_DESC }),
    );

    expect(days).toEqual([]);
    expect(statementRepository.dayTotals).not.toHaveBeenCalled();
  });

  it("should reject an inverted period", async () => {
    await expect(
      useCase.find(
        USER_ID,
        query({ start_date: "2026-10-31", end_date: "2026-10-01" }),
      ),
    ).rejects.toThrow("A data inicial não pode ser depois da data final.");
  });

  it("should reject a day that does not exist", async () => {
    await expect(
      useCase.find(USER_ID, query({ end_date: "2026-02-31" })),
    ).rejects.toThrow("Data inválida.");
  });

  it("should reject a minimum amount above the maximum", async () => {
    await expect(
      useCase.find(USER_ID, query({ min_amount: 100, max_amount: 50 })),
    ).rejects.toThrow("O valor mínimo não pode ser maior que o valor máximo.");
  });

  it("should reject an invalid cursor before querying", async () => {
    await expect(
      useCase.find(USER_ID, query({ cursor: "invalid" })),
    ).rejects.toThrow("Cursor de paginação inválido.");

    expect(statementRepository.findPage).not.toHaveBeenCalled();
  });

  it("should throw when the user does not exist", async () => {
    usersRepository.find.mockResolvedValue(null);

    await expect(useCase.find(USER_ID, query())).rejects.toThrow(
      "Usuário não existe!",
    );
  });
});
