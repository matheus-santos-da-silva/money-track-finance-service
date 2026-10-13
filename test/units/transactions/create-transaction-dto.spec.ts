import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { MAX_INSTALLMENTS } from "src/shared/constants/transactions";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";

const validPayload = {
  category_id: "test-category-id",
  amount: 100,
  total_installments: 1,
  current_installment: 1,
};

const errorsFor = async (overrides: Record<string, unknown>) => {
  const dto = plainToInstance(CreateTransactionDTO, {
    ...validPayload,
    ...overrides,
  });
  const errors = await validate(dto);
  return errors.map((error) => error.property);
};

describe("CreateTransactionDTO validation", () => {
  it("should accept a valid payload", async () => {
    expect(await errorsFor({})).toEqual([]);
  });

  it("should accept the maximum number of installments", async () => {
    expect(await errorsFor({ total_installments: MAX_INSTALLMENTS })).toEqual([]);
  });

  it("should reject more installments than the limit", async () => {
    expect(await errorsFor({ total_installments: MAX_INSTALLMENTS + 1 })).toContain(
      "total_installments"
    );
    expect(await errorsFor({ total_installments: 1_000_000 })).toContain(
      "total_installments"
    );
  });

  it("should reject zero, negative and fractional installments", async () => {
    expect(await errorsFor({ total_installments: 0 })).toContain("total_installments");
    expect(await errorsFor({ total_installments: -3 })).toContain("total_installments");
    expect(await errorsFor({ total_installments: 2.5 })).toContain("total_installments");
  });

  it("should reject an invalid current installment", async () => {
    expect(await errorsFor({ current_installment: MAX_INSTALLMENTS + 1 })).toContain(
      "current_installment"
    );
  });

  it("should reject zero, negative and non numeric amounts", async () => {
    expect(await errorsFor({ amount: 0 })).toContain("amount");
    expect(await errorsFor({ amount: -10 })).toContain("amount");
    expect(await errorsFor({ amount: "abc" })).toContain("amount");
    expect(await errorsFor({ amount: 10.123 })).toContain("amount");
  });
});
