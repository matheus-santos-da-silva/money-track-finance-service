import { Prisma } from "@prisma/client";
import { isTransientError } from "src/infra/kafka/dead-letter/is-transient-error";

const knownRequestError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("erro do prisma", {
    code,
    clientVersion: "test",
  });

describe("isTransientError", () => {
  describe("permanent errors (retry would be pointless)", () => {
    it("should treat Prisma validation errors (invalid payload) as permanent", () => {
      const error = new Prisma.PrismaClientValidationError("plano inválido", {
        clientVersion: "test",
      });
      expect(isTransientError(error)).toBe(false);
    });

    it.each(["P2002", "P2003", "P2025"])(
      "should treat constraint/not-found error %s as permanent",
      (code) => {
        expect(isTransientError(knownRequestError(code))).toBe(false);
      }
    );

    it.each([
      ["TypeError", new TypeError("Cannot read properties of null")],
      ["RangeError", new RangeError("fora do intervalo")],
      ["SyntaxError", new SyntaxError("JSON inválido")],
    ])("should treat %s as permanent", (_name, error) => {
      expect(isTransientError(error)).toBe(false);
    });
  });

  describe("transient errors (retry can help)", () => {
    it.each(["P1001", "P1002", "P1008", "P1017", "P2024", "P2028"])(
      "should treat infrastructure error %s as transient",
      (code) => {
        expect(isTransientError(knownRequestError(code))).toBe(true);
      }
    );

    it("should treat Prisma initialization errors (database unreachable) as transient", () => {
      const error = new Prisma.PrismaClientInitializationError(
        "não conectou",
        "test"
      );
      expect(isTransientError(error)).toBe(true);
    });

    it("should treat network errors as transient", () => {
      const error = Object.assign(new Error("connect ECONNREFUSED"), {
        code: "ECONNREFUSED",
      });
      expect(isTransientError(error)).toBe(true);
    });

    it("should default to transient for unknown errors", () => {
      expect(isTransientError(new Error("algo inesperado"))).toBe(true);
      expect(isTransientError("string solta")).toBe(true);
    });
  });
});
