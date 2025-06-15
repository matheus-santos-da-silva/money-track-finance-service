import { UpdateTransactionDTO } from "src/domain/DTO/transactions/update-transaction-DTO";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { GetIncomesResponseDTO } from "src/domain/DTO/incomes/get-incomes-response-DTO";
import { CreateIncomeResponseDTO } from "src/domain/DTO/incomes/create-income-response-DTO";
import { GetIncomeByIdResponseDTO } from "src/domain/DTO/incomes/get-income-by-id-response-DTO";
import { GetUserTransactionsInputDTO } from "src/domain/DTO/transactions/get-transactions-input-DTO";

export abstract class IncomesRepositoryProtocol {
  abstract create(data: CreateTransactionDTO): Promise<CreateIncomeResponseDTO>;

  abstract find(
    data: GetUserTransactionsInputDTO
  ): Promise<GetIncomesResponseDTO[]>;

  abstract findById(id: string): Promise<GetIncomeByIdResponseDTO>;
  abstract delete(id: string): Promise<void>;
  abstract update(id: string, data: UpdateTransactionDTO): Promise<void>;
}
