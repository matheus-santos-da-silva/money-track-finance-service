import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { assertCanWrite } from "src/shared/transactions/plan-policy";
import { buildInstallments } from "src/shared/transactions/installments";
import { toCalendarDate } from "src/shared/transactions/calendar-date";
import { CreateTransactionInput } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateExpenseProtocol } from "src/domain/use-cases-protocol/expenses";
import { ensureCategoryForKind } from "src/application/services/ensure-category-for-kind";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { CreateExpenseResponseDTO } from "src/domain/DTO/expenses/create-expense-response-DTO";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { RecurringSeriesRepositoryProtocol } from "src/infra/database/repositories/recurring-series/protocols/recurring-series-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class CreateExpenseUseCase implements CreateExpenseProtocol {
  constructor(
    private readonly expenseRepository: ExpensesRepositoryProtocol,
    private readonly categoryRepository: CategoriesRepositoryProtocol,
    private readonly usersRepository: UsersRepositoryProtocol,
    private readonly seriesRepository: RecurringSeriesRepositoryProtocol,
  ) {}

  async create(data: CreateTransactionInput): Promise<CreateExpenseResponseDTO> {
    const recurrence = data.recurrence ?? "NONE";

    if (recurrence !== "NONE" && data.total_installments > 1) {
      throw new BadRequestException(
        "Não é possível cadastrar recorrência em uma despesa parcelada.",
      );
    }

    if (Prisma.Decimal(data.amount).equals(0)) {
      throw new BadRequestException(
        "Não é possível cadastrar uma despesa com o valor R$ 00,00.",
      );
    }

    const user = await this.usersRepository.find(data.user_id);
    if (!user) {
      throw new BadRequestException(
        "Não foi possível cadastrar a Despesa. Usuário não existe!",
      );
    }
    assertCanWrite(user, "cadastrar uma despesa");

    const category = await ensureCategoryForKind(
      this.categoryRepository,
      data.user_id,
      data.category_id,
      "EXPENSE",
    );

    const firstDate = toCalendarDate(data.transaction_date);
    const created = await this.persist(data, recurrence, category.id, firstDate);

    return { ...created, amount: Prisma.Decimal(created.amount).toNumber() };
  }

  private async persist(
    data: CreateTransactionInput,
    recurrence: "NONE" | "MONTHLY" | "YEARLY",
    category_id: string,
    firstDate: Date,
  ): Promise<CreateExpenseResponseDTO> {
    // Parcelado: valores em centavos, uma data por mês e tudo numa transação.
    if (data.total_installments > 1) {
      const plan = buildInstallments({
        amount: data.amount,
        count: data.total_installments,
        firstDate,
        groupId: randomUUID(),
      });

      const [first] = await this.expenseRepository.createInstallments(
        plan.map((installment) => ({
          user_id: data.user_id,
          category_id,
          description: data.description,
          recurrence: "NONE",
          ...installment,
        })),
      );
      return first;
    }

    // Recorrente: cria a série e a 1ª ocorrência; as próximas são geradas sob demanda.
    if (recurrence !== "NONE") {
      return this.seriesRepository.createWithFirstOccurrence({
        user_id: data.user_id,
        kind: "EXPENSE",
        frequency: recurrence,
        anchor_date: firstDate,
        category_id,
        amount: Prisma.Decimal(data.amount),
        description: data.description,
      });
    }

    const created = await this.expenseRepository.create({
      user_id: data.user_id,
      category_id,
      description: data.description,
      amount: Prisma.Decimal(data.amount),
      recurrence: "NONE",
      total_installments: 1,
      current_installment: 1,
      transaction_date: firstDate,
    });

    if (!created) {
      throw new BadRequestException(
        "Erro na criação da despesa, tente novamente!",
      );
    }
    return created;
  }
}
