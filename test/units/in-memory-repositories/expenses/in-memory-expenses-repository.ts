import { CreateFinancialEntryDTO } from "src/domain/DTO/create-financial-entry-DTO";
import { CreateExpenseResponseDTO } from "src/domain/DTO/expenses/create-expense-response-DTO";
import { Expense } from "src/domain/entities/expenses/expense";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";

export class InMemoryExpensesRepository implements ExpensesRepositoryProtocol {
  expenses: Expense[] = [];

  async create(
    data: CreateFinancialEntryDTO
  ): Promise<CreateExpenseResponseDTO> {
    const id = "984b6589-0587-4c91-838a-d33f5f6ed036";
    this.expenses.push({
      ...data,
      id,
      created_at: new Date(),
      transaction_date: new Date(),
    });
    return { ...data, id };
  }
}
