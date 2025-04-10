import { CreateFinancialEntryDTO } from "src/domain/DTO/create-financial-entry-DTO";
import { CreateIncomeResponseDTO } from "src/domain/DTO/incomes/create-income-response-DTO";
import { Income } from "src/domain/entities/incomes/income";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";

export class InMemoryIncomesRepository implements IncomesRepositoryProtocol {
  incomes: Income[] = [];

  async create(
    data: CreateFinancialEntryDTO
  ): Promise<CreateIncomeResponseDTO> {
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
