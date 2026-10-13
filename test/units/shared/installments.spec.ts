import { buildInstallments, splitIntoCents } from "src/shared/transactions/installments";
import { toCalendarDate } from "src/shared/transactions/calendar-date";

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

describe("splitIntoCents", () => {
  it.each([
    [100, 3, [3334, 3333, 3333]],
    [100, 7, [1429, 1429, 1429, 1429, 1428, 1428, 1428]],
    [10, 3, [334, 333, 333]],
    [1.15, 2, [58, 57]],
    [0.03, 3, [1, 1, 1]],
    [100, 1, [10000]],
  ])("should split R$ %p in %p parts as %p cents", (amount, parts, expected) => {
    expect(splitIntoCents(amount, parts)).toEqual(expected);
  });

  it("should split R$ 1000 in 12 with at most 1 cent of difference", () => {
    const cents = splitIntoCents(1000, 12);
    expect(sum(cents)).toBe(100000);
    expect(Math.max(...cents) - Math.min(...cents)).toBe(1);
    expect(cents.slice(0, 4)).toEqual([8334, 8334, 8334, 8334]);
  });

  it("should always add up to the total and never differ by more than 1 cent", () => {
    for (const amount of [0.07, 1, 9.99, 19.9, 123.45, 1000, 99999.99]) {
      for (let parts = 1; parts <= 60; parts++) {
        if (Math.round(amount * 100) < parts) continue;
        const cents = splitIntoCents(amount, parts);
        expect(sum(cents)).toBe(Math.round(amount * 100));
        expect(Math.max(...cents) - Math.min(...cents)).toBeLessThanOrEqual(1);
        expect(Math.min(...cents)).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("should reject an amount too low for the number of parts", () => {
    expect(() => splitIntoCents(0.02, 3)).toThrow(
      "O valor é baixo demais para 3 parcelas"
    );
  });

  it("should reject more than 2 decimal places", () => {
    expect(() => splitIntoCents(10.123, 3)).toThrow(
      "O valor deve ter no máximo 2 casas decimais."
    );
  });
});

describe("buildInstallments", () => {
  const build = (amount: number, count: number, firstDate: string) =>
    buildInstallments({
      amount,
      count,
      firstDate: toCalendarDate(firstDate),
      groupId: "group-id",
    });

  it("should build amounts, numbering and the same group for every installment", () => {
    const plan = build(100, 3, "2026-10-15");

    expect(plan.map((p) => p.amount.toFixed(2))).toEqual(["33.34", "33.33", "33.33"]);
    expect(plan.map((p) => p.current_installment)).toEqual([1, 2, 3]);
    expect(plan.every((p) => p.total_installments === 3)).toBe(true);
    expect(plan.every((p) => p.installment_group_id === "group-id")).toBe(true);
    expect(plan.reduce((s, p) => s + Number(p.amount.toFixed(2)), 0)).toBeCloseTo(100, 10);
  });

  it("should not store fractions of cents", () => {
    for (const p of build(100, 7, "2026-10-15")) {
      expect(p.amount.decimalPlaces()).toBeLessThanOrEqual(2);
    }
  });

  it("should schedule one installment per month from the ORIGINAL date (31/jan)", () => {
    const dates = build(600, 6, "2026-01-31").map((p) =>
      p.transaction_date.toISOString().slice(0, 10)
    );

    expect(dates).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
      "2026-05-31",
      "2026-06-30",
    ]);
  });

  it("should support the maximum of 60 installments", () => {
    const plan = build(600, 60, "2026-01-31");
    expect(plan).toHaveLength(60);
    // a parcela 60 é a de índice 59: 59 meses depois de 31/01/2026
    expect(plan[59].transaction_date.toISOString().slice(0, 10)).toBe("2030-12-31");
  });

  it("should keep the first installment on the chosen date", () => {
    expect(build(100, 2, "2026-10-15")[0].transaction_date.toISOString()).toBe(
      "2026-10-15T12:00:00.000Z"
    );
  });
});
