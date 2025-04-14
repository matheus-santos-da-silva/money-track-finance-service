import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateExpenseResponseDTO } from "src/domain/DTO/expenses/create-expense-response-DTO";
import { Expense } from "src/domain/entities/expenses/expense";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { GetExpensesResponseDTO } from "src/domain/DTO/expenses/get-expenses-response-DTO";
import { GetUserTransactionsInputDTO } from "src/domain/DTO/transactions/get-transactions-input-DTO";

export class InMemoryExpensesRepository implements ExpensesRepositoryProtocol {
  expenses: Expense[] = [];

  async find(
    data: GetUserTransactionsInputDTO
  ): Promise<GetExpensesResponseDTO[]> {
    throw new Error("Method not implemented.");
  }

  async create(data: CreateTransactionDTO): Promise<CreateExpenseResponseDTO> {
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
