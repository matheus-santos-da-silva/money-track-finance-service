import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateIncomeResponseDTO } from "src/domain/DTO/incomes/create-income-response-DTO";
import { Income } from "src/domain/entities/incomes/income";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { GetIncomesResponseDTO } from "src/domain/DTO/incomes/get-incomes-response-DTO";
import { GetUserTransactionsInputDTO } from "src/domain/DTO/transactions/get-transactions-input-DTO";

export class InMemoryIncomesRepository implements IncomesRepositoryProtocol {
  incomes: Income[] = [];

  async find(
    data: GetUserTransactionsInputDTO
  ): Promise<GetIncomesResponseDTO[]> {
    throw new Error("Method not implemented.");
  }

  async create(data: CreateTransactionDTO): Promise<CreateIncomeResponseDTO> {
    const id = "984b6589-0587-4c91-838a-d33f5f6ed036";
    this.incomes.push({
      ...data,
      id,
      created_at: new Date(),
      transaction_date: new Date(),
    });
    return { ...data, id };
  }
}
