import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { GetStatementQueryDTO } from "src/domain/DTO/transactions/get-statement-query-DTO";

const period = { start_date: "2026-10-01", end_date: "2026-10-31" };

// Na query string tudo chega como texto.
const parse = (query: Record<string, string>) =>
  plainToInstance(GetStatementQueryDTO, { ...period, ...query });

const errorsFor = async (query: Record<string, string>) =>
  (await validate(parse(query))).map((error) => error.property);

describe("GetStatementQueryDTO", () => {
  it("should accept only the period and apply the defaults", async () => {
    const dto = parse({});

    expect(await validate(dto)).toEqual([]);
    expect(dto.sort).toBe("DATE_DESC");
    expect(dto.limit).toBe(30);
  });

  it("should require both dates in the YYYY-MM-DD format", async () => {
    expect(await errorsFor({ start_date: "2026-10-01T00:00:00Z" })).toEqual([
      "start_date",
    ]);
    expect(await errorsFor({ end_date: "31/10/2026" })).toEqual(["end_date"]);
    expect(
      (await validate(plainToInstance(GetStatementQueryDTO, {}))).map(
        (error) => error.property,
      ),
    ).toEqual(["start_date", "end_date"]);
  });

  it("should turn comma-separated lists into arrays", async () => {
    const dto = parse({
      category_ids: "a, b,,c",
      modes: "INSTALLMENT,RECURRING",
    });

    expect(await validate(dto)).toEqual([]);
    expect(dto.category_ids).toEqual(["a", "b", "c"]);
    expect(dto.modes).toEqual(["INSTALLMENT", "RECURRING"]);
  });

  it("should convert numeric params", async () => {
    const dto = parse({ min_amount: "10.5", max_amount: "200", limit: "50" });

    expect(await validate(dto)).toEqual([]);
    expect(dto).toMatchObject({ min_amount: 10.5, max_amount: 200, limit: 50 });
  });

  it("should trim the search term", () => {
    expect(parse({ search: "  mercado " }).search).toBe("mercado");
  });

  it("should reject invalid values", async () => {
    expect(await errorsFor({ type: "TRANSFER" })).toEqual(["type"]);
    expect(await errorsFor({ modes: "SINGLE,OTHER" })).toEqual(["modes"]);
    expect(await errorsFor({ sort: "NEWEST" })).toEqual(["sort"]);
    expect(await errorsFor({ min_amount: "-1" })).toEqual(["min_amount"]);
    expect(await errorsFor({ max_amount: "abc" })).toEqual(["max_amount"]);
    expect(await errorsFor({ min_amount: "1.999" })).toEqual(["min_amount"]);
    expect(await errorsFor({ search: "a".repeat(101) })).toEqual(["search"]);
  });

  it("should keep the page size between 1 and 100", async () => {
    expect(await errorsFor({ limit: "0" })).toEqual(["limit"]);
    expect(await errorsFor({ limit: "101" })).toEqual(["limit"]);
    expect(await errorsFor({ limit: "1.5" })).toEqual(["limit"]);
    expect(await errorsFor({ limit: "100" })).toEqual([]);
  });
});
