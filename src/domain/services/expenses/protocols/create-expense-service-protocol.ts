import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { Expense } from "src/domain/entities/expenses/expense";

export abstract class CreateExpenseServiceProtocol {
  abstract create(data: CreateTransactionDTO): Promise<Expense>;
}
