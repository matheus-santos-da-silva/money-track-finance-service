import { CreateFinancialEntryDTO } from "src/domain/DTO/create-financial-entry-DTO";
import { Income } from "src/domain/entities/incomes/income";

export abstract class CreateIncomeServiceProtocol {
  abstract create(data: CreateFinancialEntryDTO): Promise<Income>;
}
