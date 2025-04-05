import { Decimal } from "@prisma/client/runtime/library";
import { CreateFinancialEntryDTO } from "src/domain/DTO/create-financial-entry-DTO";
import { CreateExpenseServiceProtocol } from "src/domain/services/expenses/protocols/create-expense-service-protocol";
import { CreateExpenseProtocol } from "src/domain/use-cases-protocol/expenses";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateExpenseResponseDTO } from "src/domain/DTO/expenses/create-expense-response-DTO";

@Injectable()
export class CreateExpenseUseCase implements CreateExpenseProtocol {
  constructor(
    private readonly service: CreateExpenseServiceProtocol,
    private readonly expenseRepository: ExpensesRepositoryProtocol,
    private readonly categoryRepository: CategoriesRepositoryProtocol
  ) {}

  async create(
    data: CreateFinancialEntryDTO
  ): Promise<CreateExpenseResponseDTO> {
    try {
      const category = await this.categoryRepository.find(data.category_id);
      if (!category) {
        throw new BadRequestException("Categoria não existe, tente novamente!");
      }

      const expense = await this.service.create({
        ...data,
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
