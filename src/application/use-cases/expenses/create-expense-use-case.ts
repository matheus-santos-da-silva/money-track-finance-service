import { Decimal } from "@prisma/client/runtime/library";
import { SetUTCDates } from "src/shared/utils/set-utc-dates";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateExpenseProtocol } from "src/domain/use-cases-protocol/expenses";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { CreateExpenseResponseDTO } from "src/domain/DTO/expenses/create-expense-response-DTO";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class CreateExpenseUseCase implements CreateExpenseProtocol {
  constructor(
    private readonly expenseRepository: ExpensesRepositoryProtocol,
    private readonly categoryRepository: CategoriesRepositoryProtocol,
    private readonly usersRepository: UsersRepositoryProtocol
  ) {}

  async create(data: CreateTransactionDTO): Promise<CreateExpenseResponseDTO> {
    try {
      if (data?.recurrence !== "NONE" && data.total_installments > 1) {
        throw new BadRequestException(
          "Não é possível cadastrar recorrência em uma despesa parcelada."
        );
      }

      if (new Decimal(data.amount).equals(0)) {
        throw new BadRequestException(
          "Não é possível cadastrar uma despesa com o valor R$ 00,00."
        );
      }

      const user = await this.usersRepository.find(data.user_id);
      if (!user) {
        throw new BadRequestException(
          "Não foi possível cadastrar a Despesa. Usuário não existe!"
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
        let createdExpense: CreateExpenseResponseDTO = {
          ...data,
          id: "provisory",
        };

        for (let i = 0; i < data.total_installments; i++) {
          const installmentDate = correctTransactionDate;
          if (i !== 0) {
            installmentDate.setMonth(correctTransactionDate.getMonth() + 1);
          }

          const expense = await this.expenseRepository.create({
            ...data,
            transaction_date: installmentDate,
            created_at: correctCreatedAt,
            current_installment: i + 1,
            amount: new Decimal(Number(data.amount) / data.total_installments),
            category_id: category.id,
          });

          if (i === 0) createdExpense = expense;
        }

        return {
          ...createdExpense,
          amount: new Decimal(createdExpense.amount).toNumber(),
        };
      } else {
        const createdExpense = await this.expenseRepository.create({
          ...data,
          transaction_date: correctTransactionDate,
          created_at: correctCreatedAt,
          amount: new Decimal(data.amount),
          category_id: category.id,
        });

        if (!createdExpense) {
          throw new BadRequestException(
            "Erro na criação da despesa, tente novamente!"
          );
        }

        return {
          ...createdExpense,
          amount: new Decimal(createdExpense.amount).toNumber(),
        };
      }
    } catch (error) {
      throw error;
    }
  }
}
