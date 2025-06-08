import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateIncomeResponseDTO } from "src/domain/DTO/incomes/create-income-response-DTO";
import { GetUserTransactionsInputDTO } from "src/domain/DTO/transactions/get-transactions-input-DTO";
import { GetIncomesResponseDTO } from "src/domain/DTO/incomes/get-incomes-response-DTO";

export abstract class IncomesRepositoryProtocol {
  abstract create(data: CreateTransactionDTO): Promise<CreateIncomeResponseDTO>;

  abstract find(
    data: GetUserTransactionsInputDTO
  ): Promise<GetIncomesResponseDTO[]>;

  abstract findById(id: string): Promise<GetIncomesResponseDTO>;
}
