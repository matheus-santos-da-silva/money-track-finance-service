import {
  decodeCursor,
  encodeCursor,
  mergeStatementPages,
  sortSpec,
  StatementSort,
  StatementType,
} from "src/shared/transactions/statement";

const item = (
  id: string,
  type: StatementType,
  day: string,
  amount = 10,
) => ({
  id,
  type,
  amount,
  transaction_date: new Date(`${day}T12:00:00.000Z`),
});

const expense = (id: string, day: string, amount?: number) =>
  item(id, StatementType.EXPENSE, day, amount);
const income = (id: string, day: string, amount?: number) =>
  item(id, StatementType.INCOME, day, amount);

describe("sortSpec", () => {
  it("should map each sort option to a field and a direction", () => {
    expect(sortSpec(StatementSort.DATE_DESC)).toEqual({
      field: "transaction_date",
      direction: "desc",
    });
    expect(sortSpec(StatementSort.AMOUNT_ASC)).toEqual({
      field: "amount",
      direction: "asc",
    });
  });
});

describe("statement cursor", () => {
  it("should round-trip the position of an item sorted by date", () => {
    const cursor = encodeCursor(
      StatementSort.DATE_DESC,
      expense("e1", "2026-10-05"),
    );

    expect(decodeCursor(cursor, StatementSort.DATE_DESC)).toEqual({
      value: "2026-10-05T12:00:00.000Z",
      type: "EXPENSE",
      id: "e1",
    });
  });

  it("should round-trip the position of an item sorted by amount", () => {
    const cursor = encodeCursor(
      StatementSort.AMOUNT_DESC,
      income("i1", "2026-10-05", 236.9),
    );

    expect(decodeCursor(cursor, StatementSort.AMOUNT_DESC)).toEqual({
      value: "236.9",
      type: "INCOME",
      id: "i1",
    });
  });

  it("should reject a cursor created for another sort order", () => {
    const cursor = encodeCursor(
      StatementSort.DATE_DESC,
      expense("e1", "2026-10-05"),
    );

    expect(() => decodeCursor(cursor, StatementSort.AMOUNT_DESC)).toThrow(
      "Cursor de paginação inválido.",
    );
  });

  it("should reject a malformed cursor", () => {
    const encode = (value: unknown) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");

    const malformed = [
      "not-a-cursor",
      encode(null),
      encode({ sort: "DATE_DESC", value: "not-a-date", type: "EXPENSE", id: "e1" }),
      encode({ sort: "DATE_DESC", value: "2026-10-05", type: "OTHER", id: "e1" }),
      encode({ sort: "DATE_DESC", value: "2026-10-05", type: "EXPENSE" }),
    ];

    for (const cursor of malformed) {
      expect(() => decodeCursor(cursor, StatementSort.DATE_DESC)).toThrow(
        "Cursor de paginação inválido.",
      );
    }
  });
});

describe("mergeStatementPages", () => {
  const ids = (items: { id: string }[]) => items.map(({ id }) => id);

  it("should interleave expenses and incomes from the newest to the oldest", () => {
    const merged = mergeStatementPages(
      [expense("e1", "2026-10-13"), expense("e2", "2026-10-03")],
      [income("i1", "2026-10-05"), income("i2", "2026-10-01")],
      sortSpec(StatementSort.DATE_DESC),
    );

    expect(ids(merged)).toEqual(["e1", "i1", "e2", "i2"]);
  });

  it("should put expenses before incomes on a tie, in both directions", () => {
    const expenses = [expense("e1", "2026-10-05"), expense("e2", "2026-10-05")];
    const incomes = [income("i1", "2026-10-05")];

    expect(
      ids(mergeStatementPages(expenses, incomes, sortSpec(StatementSort.DATE_DESC))),
    ).toEqual(["e1", "e2", "i1"]);
    expect(
      ids(mergeStatementPages(expenses, incomes, sortSpec(StatementSort.DATE_ASC))),
    ).toEqual(["e1", "e2", "i1"]);
  });

  it("should merge by amount", () => {
    const merged = mergeStatementPages(
      [expense("e1", "2026-10-01", 10), expense("e2", "2026-10-02", 300)],
      [income("i1", "2026-10-03", 50)],
      sortSpec(StatementSort.AMOUNT_ASC),
    );

    expect(ids(merged)).toEqual(["e1", "i1", "e2"]);
  });

  it("should handle an empty side", () => {
    const expenses = [expense("e1", "2026-10-05")];

    expect(
      ids(mergeStatementPages(expenses, [], sortSpec(StatementSort.DATE_DESC))),
    ).toEqual(["e1"]);
    expect(
      mergeStatementPages([], [], sortSpec(StatementSort.DATE_DESC)),
    ).toEqual([]);
  });
});
