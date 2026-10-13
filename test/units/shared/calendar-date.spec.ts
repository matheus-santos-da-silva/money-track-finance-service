import {
  addMonthsClamped,
  isSameCalendarDay,
  toCalendarDate,
} from "src/shared/transactions/calendar-date";

const iso = (date: Date) => date.toISOString();

describe("toCalendarDate", () => {
  it("should store a YYYY-MM-DD string at 12:00 UTC of that day", () => {
    expect(iso(toCalendarDate("2026-10-05"))).toEqual("2026-10-05T12:00:00.000Z");
  });

  it("should keep the same day for a Date, ignoring the time of day", () => {
    expect(iso(toCalendarDate(new Date("2026-10-05T01:30:00.000Z")))).toEqual(
      "2026-10-05T12:00:00.000Z"
    );
    expect(iso(toCalendarDate(new Date("2026-10-05T23:59:59.000Z")))).toEqual(
      "2026-10-05T12:00:00.000Z"
    );
  });

  it("should default to today when nothing is provided", () => {
    const today = new Date();
    const result = toCalendarDate();

    expect(isSameCalendarDay(result, today)).toBe(true);
    expect(result.getUTCHours()).toBe(12);
  });

  it.each(["2026-10-5", "05/10/2026", "2026-10-05T10:00:00Z", "abc", ""])(
    "should reject the invalid format %p",
    (value) => {
      expect(() => toCalendarDate(value)).toThrow(
        "A data deve estar no formato AAAA-MM-DD."
      );
    }
  );

  it.each(["2026-02-31", "2026-13-01", "2026-04-31", "2027-02-29"])(
    "should reject the day that does not exist %p",
    (value) => {
      expect(() => toCalendarDate(value)).toThrow("Data inválida.");
    }
  );

  it("should accept 29/02 only in leap years", () => {
    expect(iso(toCalendarDate("2028-02-29"))).toEqual("2028-02-29T12:00:00.000Z");
  });

  it("should give the same calendar day for local and UTC getters in far-apart time zones", () => {
    const date = toCalendarDate("2026-10-05");
    // 12:00Z fica no dia 05 de UTC-11 (01:00) até UTC+11 (23:00)
    for (const offsetHours of [-11, -3, 0, 1, 9, 11]) {
      const local = new Date(date.getTime() + offsetHours * 3600 * 1000);
      expect(local.getUTCDate()).toBe(5);
    }
  });
});

describe("addMonthsClamped", () => {
  const seq = (start: string, months: number[]) =>
    months.map((m) => addMonthsClamped(toCalendarDate(start), m).toISOString().slice(0, 10));

  it("should clamp to the last day of shorter months, always from the original date", () => {
    expect(seq("2026-01-31", [0, 1, 2, 3, 4, 5])).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
      "2026-05-31",
      "2026-06-30",
    ]);
  });

  it("should handle leap years", () => {
    expect(seq("2028-01-31", [1])).toEqual(["2028-02-29"]);
    expect(seq("2028-02-29", [12])).toEqual(["2029-02-28"]);
  });

  it("should cross the year boundary", () => {
    expect(seq("2026-11-30", [0, 1, 2, 3])).toEqual([
      "2026-11-30",
      "2026-12-30",
      "2027-01-30",
      "2027-02-28",
    ]);
    expect(seq("2026-12-15", [1, 2])).toEqual(["2027-01-15", "2027-02-15"]);
  });

  it("should support long spans (60 months)", () => {
    expect(seq("2026-01-31", [60])).toEqual(["2031-01-31"]);
  });

  it("should not mutate the input date", () => {
    const original = toCalendarDate("2026-01-31");
    addMonthsClamped(original, 1);
    expect(iso(original)).toEqual("2026-01-31T12:00:00.000Z");
  });
});
