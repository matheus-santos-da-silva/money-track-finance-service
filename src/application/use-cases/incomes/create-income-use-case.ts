import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { SetUTCDates } from "src/shared/utils/set-utc-dates";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateIncomeProtocol } from "src/domain/use-cases-protocol/incomes";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { CreateIncomeResponseDTO } from "src/domain/DTO/incomes/create-income-response-DTO";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class CreateIncomeUseCase implements CreateIncomeProtocol {
  constructor(
    private readonly incomeRepository: IncomesRepositoryProtocol,
    private readonly categoryRepository: CategoriesRepositoryProtocol,
    private readonly usersRepository: UsersRepositoryProtocol,
  ) {}

  async create(data: CreateTransactionDTO): Promise<CreateIncomeResponseDTO> {
    try {
      if (data?.recurrence !== "NONE" && data.total_installments > 1) {
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

      if (user.plan === "FREE" && user.trialEndsAt < new Date()) {
        throw new BadRequestException(
          "Não é possível cadastrar uma receita para um usuário com plano gratuito.",
        );
      }

      const category = await this.categoryRepository.find(data.category_id);
      if (!category) {
        throw new BadRequestException("Categoria não existe, tente novamente!");
      }

      const correctCreatedAt = SetUTCDates(new Date());
      const correctTransactionDate = data.transaction_date
        ? SetUTCDates(new Date(data.transaction_date))
        : SetUTCDates(new Date());

      if (data.total_installments > 1) {
        let createdIncome: CreateIncomeResponseDTO = {
          ...data,
          id: "provisory",
        };

        const installmentGroupId = randomUUID();

        for (let i = 0; i < data.total_installments; i++) {
          const installmentDate = correctTransactionDate;
          if (i !== 0) {
            installmentDate.setMonth(correctTransactionDate.getMonth() + 1);
          }

          const income = await this.incomeRepository.create({
            ...data,
            transaction_date: installmentDate,
            created_at: correctCreatedAt,
            current_installment: i + 1,
            installment_group_id: installmentGroupId,
            amount: Prisma.Decimal(
              Number(data.amount) / data.total_installments,
            ),
            category_id: category.id,
          });

          if (i === 0) createdIncome = income;
        }

        return {
          ...createdIncome,
          amount: Prisma.Decimal(createdIncome.amount).toNumber(),
        };
      } else {
        const createdIncome = await this.incomeRepository.create({
          ...data,
          amount: Prisma.Decimal(data.amount),
          created_at: correctCreatedAt,
          transaction_date: correctTransactionDate,
          category_id: category.id,
        });

        if (!createdIncome) {
          throw new BadRequestException(
            "Erro na criação da receita, tente novamente!",
          );
        }

        return {
          ...createdIncome,
          amount: Prisma.Decimal(createdIncome.amount).toNumber(),
        };
      }
    } catch (error) {
      throw error;
    }
  }
}
