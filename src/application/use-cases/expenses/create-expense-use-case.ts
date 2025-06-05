import { Decimal } from "@prisma/client/runtime/library";
import { SetUTCDates } from "src/shared/utils/set-utc-dates";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateExpenseProtocol } from "src/domain/use-cases-protocol/expenses";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { CreateExpenseResponseDTO } from "src/domain/DTO/expenses/create-expense-response-DTO";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { CreateExpenseServiceProtocol } from "src/domain/services/expenses/protocols/create-expense-service-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class CreateExpenseUseCase implements CreateExpenseProtocol {
  constructor(
    private readonly service: CreateExpenseServiceProtocol,
    private readonly expenseRepository: ExpensesRepositoryProtocol,
    private readonly categoryRepository: CategoriesRepositoryProtocol,
    private readonly usersRepository: UsersRepositoryProtocol
  ) {}

  async create(data: CreateTransactionDTO): Promise<CreateExpenseResponseDTO> {
    try {
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

      const correctTransactionDate = data.transaction_date
        ? data.transaction_date
        : SetUTCDates(new Date());
      const correctCreatedAt = SetUTCDates(new Date());

      const expense = await this.service.create({
        ...data,
        transaction_date: correctTransactionDate,
        created_at: correctCreatedAt,
        amount: new Decimal(data.amount),
        category_id: category.id,
      });

      const createdExpense = await this.expenseRepository.create(expense);
      if (!createdExpense) {
        throw new BadRequestException(
          "Erro na criação da despesa, tente novamente!"
        );
      }
      return {
        ...createdExpense,
        amount: new Decimal(createdExpense.amount).toNumber(),
      };
    } catch (error) {
      throw error;
    }
  }
}
