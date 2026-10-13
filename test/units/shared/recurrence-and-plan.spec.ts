import { toCalendarDate } from "src/shared/transactions/calendar-date";
import { assertCanWrite, hasPremiumAccess } from "src/shared/transactions/plan-policy";
import { materializationHorizon, occurrenceDates } from "src/shared/transactions/recurrence";

const day = (value: string) => toCalendarDate(value);
const days = (dates: Date[]) => dates.map((d) => d.toISOString().slice(0, 10));

describe("occurrenceDates", () => {
  it("should generate monthly dates after the last generated one, up to the limit", () => {
    const dates = occurrenceDates({
      anchor: day("2026-01-31"),
      frequency: "MONTHLY",
      after: day("2026-01-31"),
      upTo: day("2026-05-31"),
    });

    expect(days(dates)).toEqual(["2026-02-28", "2026-03-31", "2026-04-30", "2026-05-31"]);
  });

  it("should not repeat dates that were already generated", () => {
    const dates = occurrenceDates({
      anchor: day("2026-01-15"),
      frequency: "MONTHLY",
      after: day("2026-03-15"),
      upTo: day("2026-05-20"),
    });

    expect(days(dates)).toEqual(["2026-04-15", "2026-05-15"]);
  });

  it("should generate yearly dates keeping day and month (29/fev -> 28/fev)", () => {
    const dates = occurrenceDates({
      anchor: day("2028-02-29"),
      frequency: "YEARLY",
      after: day("2028-02-29"),
      upTo: day("2032-03-01"),
    });

    expect(days(dates)).toEqual(["2029-02-28", "2030-02-28", "2031-02-28", "2032-02-29"]);
  });

  it("should return nothing when the limit is not past the next date", () => {
    expect(
      occurrenceDates({
        anchor: day("2026-01-15"),
        frequency: "MONTHLY",
        after: day("2026-01-15"),
        upTo: day("2026-02-14"),
      })
    ).toEqual([]);
  });
});

describe("materializationHorizon", () => {
  const now = new Date("2026-10-07T12:00:00.000Z");

  it("should use the requested end when it is within 24 months", () => {
    // 17 meses à frente: além do teto antigo de 12, dentro do de 24.
    expect(materializationHorizon(day("2028-03-31"), now).toISOString().slice(0, 10)).toBe(
      "2028-03-31"
    );
  });

  it("should cap at 24 months from today", () => {
    expect(materializationHorizon(day("2030-12-31"), now).toISOString().slice(0, 10)).toBe(
      "2028-10-07"
    );
  });
});

describe("plan policy", () => {
  const future = new Date(Date.now() + 86_400_000);
  const past = new Date(Date.now() - 86_400_000);

  it("should grant access to PREMIUM regardless of the trial", () => {
    expect(hasPremiumAccess({ plan: "PREMIUM", trialEndsAt: past })).toBe(true);
  });

  it("should grant access to FREE while the trial is active", () => {
    expect(hasPremiumAccess({ plan: "FREE", trialEndsAt: future })).toBe(true);
  });

  it("should deny FREE with an expired trial", () => {
    expect(hasPremiumAccess({ plan: "FREE", trialEndsAt: past })).toBe(false);
  });

  it("should treat TRIAL as full access", () => {
    expect(hasPremiumAccess({ plan: "TRIAL", trialEndsAt: past })).toBe(true);
  });

  it("should throw Forbidden with the action in the message when read-only", () => {
    expect(() =>
      assertCanWrite({ plan: "FREE", trialEndsAt: past }, "editar uma despesa")
    ).toThrow("Não é possível editar uma despesa para um usuário com plano gratuito.");
  });

  it("should not throw when the user can write", () => {
    expect(() =>
      assertCanWrite({ plan: "PREMIUM", trialEndsAt: past }, "editar uma despesa")
    ).not.toThrow();
  });
});
