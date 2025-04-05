import { CreateFinancialEntryDTO } from "src/domain/DTO/create-financial-entry-DTO";
import { CreateExpenseResponseDTO } from "src/domain/DTO/expenses/create-expense-response-DTO";

export abstract class ExpensesRepositoryProtocol {
  abstract create(
    data: CreateFinancialEntryDTO
  ): Promise<CreateExpenseResponseDTO>;
}
