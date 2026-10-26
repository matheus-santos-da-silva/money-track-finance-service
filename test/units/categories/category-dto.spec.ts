import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateCategoryDTO } from "src/domain/DTO/categories/create-category-DTO";
import { UpdateCategoryDTO } from "src/domain/DTO/categories/update-category-DTO";

const validPayload = {
  type: "EXPENSE",
  name: "Lazer",
  icon: "#E67171-leisure",
  created_at: "2026-10-26T12:00:00.000Z",
};

const errorsOf = async (cls: any, data: Record<string, unknown>) =>
  (await validate(plainToInstance(cls, data))).map((error) => error.property);

describe("Category DTOs validation", () => {
  it("should accept a valid category", async () => {
    expect(await errorsOf(CreateCategoryDTO, validPayload)).toEqual([]);
  });

  it("should require 3 to 20 characters in the name", async () => {
    for (const cls of [CreateCategoryDTO, UpdateCategoryDTO]) {
      expect(await errorsOf(cls, { ...validPayload, name: "ab" })).toContain("name");
      expect(await errorsOf(cls, { ...validPayload, name: "a".repeat(21) })).toContain(
        "name",
      );
      expect(await errorsOf(cls, { ...validPayload, name: "a".repeat(20) })).toEqual([]);
    }
  });

  it("should trim the name before validating it", async () => {
    const dto = plainToInstance(CreateCategoryDTO, {
      ...validPayload,
      name: "  Lazer  ",
    });

    expect(await validate(dto)).toEqual([]);
    expect(dto.name).toBe("Lazer");
    expect(await errorsOf(CreateCategoryDTO, { ...validPayload, name: "  ab  " })).toContain(
      "name",
    );
  });
});
