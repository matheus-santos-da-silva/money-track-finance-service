import { Prisma } from "@prisma/client";
import { Test, TestingModule } from "@nestjs/testing";
import {
  CreateExpenseUseCase,
  DeleteExpenseUseCase,
  UpdateExpenseUseCase,
} from "src/application/use-cases/expenses";
import {
  CreateIncomeUseCase,
  DeleteIncomeUseCase,
  UpdateIncomeUseCase,
} from "src/application/use-cases/incomes";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { InMemoryUsersRepository } from "../in-memory-repositories/users/in-memory-users-repository";
import { InMemoryExpensesRepository } from "../in-memory-repositories/expenses/in-memory-expenses-repository";
import { InMemoryIncomesRepository } from "../in-memory-repositories/incomes/in-memory-incomes-repository";
import { InMemoryCategoriesRepository } from "../in-memory-repositories/categories/in-memory-categories-repository";
import { InMemoryRecurringSeriesRepository } from "../in-memory-repositories/recurring-series/in-memory-recurring-series-repository";
import { RecurringSeriesRepositoryProtocol } from "src/infra/database/repositories/recurring-series/protocols/recurring-series-repository-protocol";
import { recurringSeriesProvider } from "../helpers/recurring-series-provider";
import {
  CreateExpenseCategoryInputMock,
  CreateIncomeCategoryInputMock,
} from "../../mocks/categories/create-category-input-mock";

const USER = "test-user-id";
const past = () => new Date(Date.now() - 86_400_000);
const futureDate = () => new Date(Date.now() + 7 * 86_400_000);
const day = (value: Date) => value.toISOString().slice(0, 10);

const kinds = [
  {
    name: "expense",
    noun: "despesa",
    Create: CreateExpenseUseCase,
    Update: UpdateExpenseUseCase,
    Delete: DeleteExpenseUseCase,
    repoToken: ExpensesRepositoryProtocol,
    InMemoryRepo: InMemoryExpensesRepository,
    rows: (repo: any) => repo.expenses as any[],
    category: CreateExpenseCategoryInputMock,
    otherKindCategory: CreateIncomeCategoryInputMock,
    wrongTypeMessage: "A categoria selecionada não é uma categoria de despesa.",
  },
  {
    name: "income",
    noun: "receita",
    Create: CreateIncomeUseCase,
    Update: UpdateIncomeUseCase,
    Delete: DeleteIncomeUseCase,
    repoToken: IncomesRepositoryProtocol,
    InMemoryRepo: InMemoryIncomesRepository,
    rows: (repo: any) => repo.incomes as any[],
    category: CreateIncomeCategoryInputMock,
    otherKindCategory: CreateExpenseCategoryInputMock,
    wrongTypeMessage: "A categoria selecionada não é uma categoria de receita.",
  },
];

describe.each(kinds)("Transaction rules ($name)", (kind) => {
  let create: any;
  let update: any;
  let remove: any;
  let repo: any;
  let users: UsersRepositoryProtocol;
  let categories: CategoriesRepositoryProtocol;
  let series: InMemoryRecurringSeriesRepository;

  const addCategory = (owner: string | null, data: Record<string, unknown>) =>
    (categories as any).create(owner, data);

  const base = (over: Record<string, unknown> = {}) => ({
    user_id: USER,
    category_id: "test-category-id",
    amount: new Prisma.Decimal(100),
    total_installments: 1,
    current_installment: 1,
    recurrence: "NONE" as const,
    description: "teste",
    ...over,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        kind.Create,
        kind.Update,
        kind.Delete,
        { provide: kind.repoToken, useClass: kind.InMemoryRepo },
        { provide: CategoriesRepositoryProtocol, useClass: InMemoryCategoriesRepository },
        { provide: UsersRepositoryProtocol, useClass: InMemoryUsersRepository },
        recurringSeriesProvider,
      ],
    }).compile();

    create = module.get(kind.Create);
    update = module.get(kind.Update);
    remove = module.get(kind.Delete);
    repo = module.get(kind.repoToken);
    users = module.get(UsersRepositoryProtocol);
    categories = module.get(CategoriesRepositoryProtocol);
    series = module.get(RecurringSeriesRepositoryProtocol);

    await users.create(USER, "PREMIUM", new Date());
    await addCategory(USER, kind.category);
  });

  describe("installments", () => {
    it("should split the amount in cents, one date per month and a shared group", async () => {
      const result = await create.create(
        base({ total_installments: 3, transaction_date: "2026-01-31" })
      );

      const rows = kind.rows(repo);
      expect(rows).toHaveLength(3);
      expect(rows.map((r) => Number(r.amount).toFixed(2))).toEqual(["33.34", "33.33", "33.33"]);
      expect(rows.map((r) => day(r.transaction_date))).toEqual([
        "2026-01-31",
        "2026-02-28",
        "2026-03-31",
      ]);
      expect(rows.map((r) => r.current_installment)).toEqual([1, 2, 3]);
      expect(new Set(rows.map((r) => r.installment_group_id)).size).toBe(1);
      expect(rows[0].installment_group_id).toBeDefined();
      // devolve a 1ª parcela
      expect(result.amount).toBe(33.34);
      expect(result.current_installment).toBe(1);
    });

    it("should reject an amount too low for the number of installments", async () => {
      await expect(
        create.create(base({ amount: new Prisma.Decimal(0.02), total_installments: 3 }))
      ).rejects.toThrow("O valor é baixo demais para 3 parcelas");
      expect(kind.rows(repo)).toHaveLength(0);
    });
  });

  describe("calendar dates", () => {
    it("should store a date-only transaction_date at 12:00 UTC", async () => {
      await create.create(base({ transaction_date: "2026-10-05" }));

      expect(kind.rows(repo)[0].transaction_date.toISOString()).toBe(
        "2026-10-05T12:00:00.000Z"
      );
    });

    it("should reject an invalid date", async () => {
      await expect(create.create(base({ transaction_date: "2026-02-31" }))).rejects.toThrow(
        "Data inválida."
      );
    });
  });

  describe("category", () => {
    it("should not accept a category that belongs to another user", async () => {
      await addCategory("another-user-id", { ...kind.category, id: "foreign-category" });

      await expect(create.create(base({ category_id: "foreign-category" }))).rejects.toThrow(
        "Categoria não existe, tente novamente!"
      );
    });

    it("should accept a default category (no owner)", async () => {
      await addCategory(null, { ...kind.category, id: "default-category" });

      await expect(
        create.create(base({ category_id: "default-category" }))
      ).resolves.toBeDefined();
    });

    it("should not accept a category of the other type", async () => {
      await addCategory(USER, { ...kind.otherKindCategory, id: "other-type-category" });

      await expect(create.create(base({ category_id: "other-type-category" }))).rejects.toThrow(
        kind.wrongTypeMessage
      );
    });

    it("should validate the category on update too", async () => {
      await addCategory("another-user-id", { ...kind.category, id: "foreign-category" });
      const created = await create.create(base());

      await expect(
        update.update({ id: created.id, user_id: USER, data: { category_id: "foreign-category" } })
      ).rejects.toThrow("Categoria não existe, tente novamente!");
    });

    describe("archived category", () => {
      const archive = (category_id: string) =>
        categories.archive({ user_id: USER, category_id });

      beforeEach(async () => {
        await addCategory(USER, { ...kind.category, id: "archived-category" });
      });

      it("should not accept an archived category on create", async () => {
        await archive("archived-category");

        await expect(create.create(base({ category_id: "archived-category" }))).rejects.toThrow(
          "Categoria não existe, tente novamente!"
        );
      });

      it("should not accept moving a transaction to an archived category", async () => {
        const created = await create.create(base());
        await archive("archived-category");

        await expect(
          update.update({ id: created.id, user_id: USER, data: { category_id: "archived-category" } })
        ).rejects.toThrow("Categoria não existe, tente novamente!");
      });

      it("should keep old transactions editable when their category is archived (app resends it)", async () => {
        const created = await create.create(base({ category_id: "archived-category" }));
        await archive("archived-category");

        await update.update({
          id: created.id,
          user_id: USER,
          data: { category_id: "archived-category", description: "editada" },
        });

        const row = kind.rows(repo).find((r) => r.id === created.id);
        expect(row.category_id).toBe("archived-category");
        expect(row.description).toBe("editada");
      });
    });
  });

  describe("plan (free users with an expired trial are read-only)", () => {
    beforeEach(async () => {
      await users.create("expired-user-id", "FREE", past());
      await addCategory("expired-user-id", { ...kind.category, id: "expired-category" });
    });

    it("should block creating", async () => {
      await expect(
        create.create(base({ user_id: "expired-user-id", category_id: "expired-category" }))
      ).rejects.toThrow(`Não é possível cadastrar uma ${kind.noun} para um usuário com plano gratuito.`);
    });

    it("should block editing", async () => {
      await repo.create({
        ...base({ user_id: "expired-user-id", category_id: "expired-category" }),
        transaction_date: new Date(),
      });
      const [row] = kind.rows(repo);

      await expect(
        update.update({ id: row.id, user_id: "expired-user-id", data: { description: "novo" } })
      ).rejects.toThrow(`Não é possível editar uma ${kind.noun} para um usuário com plano gratuito.`);
    });

    it("should still allow deleting", async () => {
      await repo.create({
        ...base({ user_id: "expired-user-id", category_id: "expired-category" }),
        transaction_date: new Date(),
      });
      const [row] = kind.rows(repo);

      await remove.delete({ id: row.id, user_id: "expired-user-id", applyToAll: false });

      expect(kind.rows(repo)).toHaveLength(0);
    });

    it("should allow FREE users while the trial is still active", async () => {
      await users.create("trial-user-id", "FREE", futureDate());
      await addCategory("trial-user-id", { ...kind.category, id: "trial-category" });

      await expect(
        create.create(base({ user_id: "trial-user-id", category_id: "trial-category" }))
      ).resolves.toBeDefined();
    });
  });

  describe("update rules", () => {
    it("should ignore unchanged structural fields sent by the app (full form)", async () => {
      const created = await create.create(
        base({ total_installments: 2, transaction_date: "2026-03-10" })
      );
      const [first] = kind.rows(repo);

      await expect(
        update.update({
          id: created.id,
          user_id: USER,
          data: {
            applyToAll: true,
            description: "novo texto",
            recurrence: "NONE",
            total_installments: 2,
            transaction_date: "2026-03-10",
            amount: 55,
          },
        })
      ).resolves.toBeUndefined();

      expect(kind.rows(repo).every((r) => r.description === "novo texto")).toBe(true);
      expect(first.installment_group_id).toBeDefined();
    });

    it("should reject changing the recurrence or the installments of an existing transaction", async () => {
      const created = await create.create(base());

      await expect(
        update.update({ id: created.id, user_id: USER, data: { recurrence: "MONTHLY" } })
      ).rejects.toThrow("Não é permitido alterar a recorrência ou o parcelamento");
      await expect(
        update.update({ id: created.id, user_id: USER, data: { total_installments: 3 } })
      ).rejects.toThrow("Não é permitido alterar a recorrência ou o parcelamento");
    });

    it("should reject changing the date of all installments at once", async () => {
      const created = await create.create(
        base({ total_installments: 2, transaction_date: "2026-03-10" })
      );

      await expect(
        update.update({
          id: created.id,
          user_id: USER,
          data: { applyToAll: true, transaction_date: "2026-03-11" },
        })
      ).rejects.toThrow("Não é possível alterar a data de todas as parcelas");
    });

    it("should allow changing the date of a single transaction", async () => {
      const created = await create.create(base({ transaction_date: "2026-03-10" }));

      await update.update({
        id: created.id,
        user_id: USER,
        data: { transaction_date: "2026-03-12" },
      });

      expect(kind.rows(repo)[0].transaction_date.toISOString()).toBe(
        "2026-03-12T12:00:00.000Z"
      );
    });
  });

  describe("recurring transactions", () => {
    const createMonthly = () =>
      create.create(base({ recurrence: "MONTHLY", transaction_date: "2026-01-31" }));

    it("should create a series and its first occurrence", async () => {
      await createMonthly();

      const rows = kind.rows(repo);
      expect(rows).toHaveLength(1);
      expect(rows[0].recurrence).toBe("MONTHLY");
      expect(rows[0].recurrence_series_id).toBeDefined();
      expect(series.series).toHaveLength(1);
      expect(day(series.series[0].generated_until)).toBe("2026-01-31");
    });

    it("should edit this occurrence and the following ones, and the series template", async () => {
      await createMonthly();
      const seriesRecord = series.series[0];
      // ocorrências de jan a abr já geradas
      await series.appendOccurrences(seriesRecord, [
        new Date("2026-02-28T12:00:00Z"),
        new Date("2026-03-31T12:00:00Z"),
        new Date("2026-04-30T12:00:00Z"),
      ]);
      const march = kind.rows(repo).find((r) => day(r.transaction_date) === "2026-03-31");

      await update.update({
        id: march.id,
        user_id: USER,
        data: { applyToAll: true, amount: 250, description: "reajuste" },
      });

      const byDay = Object.fromEntries(kind.rows(repo).map((r) => [day(r.transaction_date), r]));
      expect(Number(byDay["2026-01-31"].amount)).toBe(100); // antes: intacta
      expect(Number(byDay["2026-02-28"].amount)).toBe(100);
      expect(Number(byDay["2026-03-31"].amount)).toBe(250); // esta e as seguintes
      expect(Number(byDay["2026-04-30"].amount)).toBe(250);
      expect(byDay["2026-04-30"].description).toBe("reajuste");
      expect(Number(series.series[0].amount)).toBe(250); // molde para as próximas
    });

    it("should delete only one occurrence without stopping the series", async () => {
      await createMonthly();
      await series.appendOccurrences(series.series[0], [new Date("2026-02-28T12:00:00Z")]);
      const feb = kind.rows(repo).find((r) => day(r.transaction_date) === "2026-02-28");

      await remove.delete({ id: feb.id, user_id: USER, applyToAll: false });

      expect(kind.rows(repo).map((r) => day(r.transaction_date))).toEqual(["2026-01-31"]);
      expect(series.series[0].active).toBe(true);
    });

    it("should delete this occurrence and the following ones and stop the series", async () => {
      await createMonthly();
      await series.appendOccurrences(series.series[0], [
        new Date("2026-02-28T12:00:00Z"),
        new Date("2026-03-31T12:00:00Z"),
      ]);
      const feb = kind.rows(repo).find((r) => day(r.transaction_date) === "2026-02-28");

      await remove.delete({ id: feb.id, user_id: USER, applyToAll: true });

      expect(kind.rows(repo).map((r) => day(r.transaction_date))).toEqual(["2026-01-31"]);
      expect(series.series[0].active).toBe(false);
    });

    it("should remove the whole series when deleting from the first occurrence on", async () => {
      await createMonthly();
      await series.appendOccurrences(series.series[0], [new Date("2026-02-28T12:00:00Z")]);
      const first = kind.rows(repo).find((r) => day(r.transaction_date) === "2026-01-31");

      await remove.delete({ id: first.id, user_id: USER, applyToAll: true });

      expect(kind.rows(repo)).toHaveLength(0);
      expect(series.series).toHaveLength(0);
    });
  });
});
