import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateExpenseResponseDTO } from "src/domain/DTO/expenses/create-expense-response-DTO";
import { GetUserTransactionsInputDTO } from "src/domain/DTO/transactions/get-transactions-input-DTO";
import { GetExpensesResponseDTO } from "src/domain/DTO/expenses/get-expenses-response-DTO";

export abstract class ExpensesRepositoryProtocol {
  abstract create(
    data: CreateTransactionDTO
  ): Promise<CreateExpenseResponseDTO>;

  abstract find(
    data: GetUserTransactionsInputDTO
  ): Promise<GetExpensesResponseDTO[]>;

  abstract findById(id: string): Promise<GetExpensesResponseDTO>;
}
