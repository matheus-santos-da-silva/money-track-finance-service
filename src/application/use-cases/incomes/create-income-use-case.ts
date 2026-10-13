import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { assertCanWrite } from "src/shared/transactions/plan-policy";
import { buildInstallments } from "src/shared/transactions/installments";
import { toCalendarDate } from "src/shared/transactions/calendar-date";
import { CreateTransactionInput } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateIncomeProtocol } from "src/domain/use-cases-protocol/incomes";
import { ensureCategoryForKind } from "src/application/services/ensure-category-for-kind";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { CreateIncomeResponseDTO } from "src/domain/DTO/incomes/create-income-response-DTO";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { RecurringSeriesRepositoryProtocol } from "src/infra/database/repositories/recurring-series/protocols/recurring-series-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class CreateIncomeUseCase implements CreateIncomeProtocol {
  constructor(
    private readonly incomeRepository: IncomesRepositoryProtocol,
    private readonly categoryRepository: CategoriesRepositoryProtocol,
    private readonly usersRepository: UsersRepositoryProtocol,
    private readonly seriesRepository: RecurringSeriesRepositoryProtocol,
  ) {}

  async create(data: CreateTransactionInput): Promise<CreateIncomeResponseDTO> {
    const recurrence = data.recurrence ?? "NONE";

    if (recurrence !== "NONE" && data.total_installments > 1) {
      throw new BadRequestException(
        "Não é possível cadastrar recorrência em uma receita parcelada.",
      );
    }

    if (Prisma.Decimal(data.amount).equals(0)) {
      throw new BadRequestException(
        "Não é possível cadastrar uma receita com o valor R$ 00,00.",
      );
    }

    const user = await this.usersRepository.find(data.user_id);
    if (!user) {
      throw new BadRequestException(
        "Não foi possível cadastrar a Receita. Usuário não existe!",
      );
    }
    assertCanWrite(user, "cadastrar uma receita");

    const category = await ensureCategoryForKind(
      this.categoryRepository,
      data.user_id,
      data.category_id,
      "INCOME",
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
  ): Promise<CreateIncomeResponseDTO> {
    // Parcelado: valores em centavos, uma data por mês e tudo numa transação.
    if (data.total_installments > 1) {
      const plan = buildInstallments({
        amount: data.amount,
        count: data.total_installments,
        firstDate,
        groupId: randomUUID(),
      });

      const [first] = await this.incomeRepository.createInstallments(
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
        kind: "INCOME",
        frequency: recurrence,
        anchor_date: firstDate,
        category_id,
        amount: Prisma.Decimal(data.amount),
        description: data.description,
      });
    }

    const created = await this.incomeRepository.create({
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
        "Erro na criação da receita, tente novamente!",
      );
    }
    return created;
  }
}
