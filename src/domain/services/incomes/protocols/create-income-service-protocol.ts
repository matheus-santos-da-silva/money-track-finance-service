import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { Income } from "src/domain/entities/incomes/income";

export abstract class CreateIncomeServiceProtocol {
  abstract create(data: CreateTransactionDTO): Promise<Income>;
}
