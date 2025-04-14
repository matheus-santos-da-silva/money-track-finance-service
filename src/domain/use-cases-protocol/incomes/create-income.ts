import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateIncomeResponseDTO } from "src/domain/DTO/incomes/create-income-response-DTO";

export abstract class CreateIncomeProtocol {
  abstract create(data: CreateTransactionDTO): Promise<CreateIncomeResponseDTO>;
}
