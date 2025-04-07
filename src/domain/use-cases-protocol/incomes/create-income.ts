import { CreateFinancialEntryDTO } from "src/domain/DTO/create-financial-entry-DTO";
import { CreateIncomeResponseDTO } from "src/domain/DTO/incomes/create-income-response-DTO";

export abstract class CreateIncomeProtocol {
  abstract create(
    data: CreateFinancialEntryDTO
  ): Promise<CreateIncomeResponseDTO>;
}
