import { UpdateTransactionDTO } from "src/domain/DTO/transactions/update-transaction-DTO";
import { CreateDBTransactionDTO } from "src/domain/DTO/transactions/create-db-transaction-DTO";
import { GetExpensesResponseDTO } from "src/domain/DTO/expenses/get-expenses-response-DTO";
import { CreateExpenseResponseDTO } from "src/domain/DTO/expenses/create-expense-response-DTO";
import { GetExpenseByIdResponseDTO } from "src/domain/DTO/expenses/get-expense-by-id-response-DTO";
import { GetUserTransactionsInputDTO } from "src/domain/DTO/transactions/get-transactions-input-DTO";

export abstract class ExpensesRepositoryProtocol {
  abstract create(
    data: CreateDBTransactionDTO
  ): Promise<CreateExpenseResponseDTO>;

  abstract find(
    data: GetUserTransactionsInputDTO
  ): Promise<GetExpensesResponseDTO[]>;

  abstract findById(id: string): Promise<GetExpenseByIdResponseDTO>;
  abstract delete(id: string): Promise<void>;
  abstract deleteByInstallmentsGroupId(groupId: string): Promise<void>;
  abstract update(id: string, data: UpdateTransactionDTO): Promise<void>;
  abstract updateByInstallmentsGroupId(
    groupId: string,
    data: UpdateTransactionDTO
  ): Promise<void>;
}
