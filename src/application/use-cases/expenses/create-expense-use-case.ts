import { Decimal } from "@prisma/client/runtime/library";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateExpenseServiceProtocol } from "src/domain/services/expenses/protocols/create-expense-service-protocol";
import { CreateExpenseProtocol } from "src/domain/use-cases-protocol/expenses";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateExpenseResponseDTO } from "src/domain/DTO/expenses/create-expense-response-DTO";
import { SetUTCDates } from "src/shared/utils/set-utc-dates";

@Injectable()
export class CreateExpenseUseCase implements CreateExpenseProtocol {
  constructor(
    private readonly service: CreateExpenseServiceProtocol,
    private readonly expenseRepository: ExpensesRepositoryProtocol,
    private readonly categoryRepository: CategoriesRepositoryProtocol
  ) {}

  async create(data: CreateTransactionDTO): Promise<CreateExpenseResponseDTO> {
    try {
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
      return createdExpense;
    } catch (error) {
      throw error;
    }
  }
}
