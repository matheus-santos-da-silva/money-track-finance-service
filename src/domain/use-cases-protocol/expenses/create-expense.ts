import { CreateTransactionInput } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateExpenseResponseDTO } from "src/domain/DTO/expenses/create-expense-response-DTO";

export abstract class CreateExpenseProtocol {
  abstract create(
    data: CreateTransactionInput
  ): Promise<CreateExpenseResponseDTO>;
}
