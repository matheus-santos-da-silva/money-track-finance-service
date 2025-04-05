import { CreateFinancialEntryDTO } from "src/domain/DTO/create-financial-entry-DTO";
import { Expense } from "src/domain/entities/expenses/expense";

export abstract class CreateExpenseServiceProtocol {
  abstract create(data: CreateFinancialEntryDTO): Promise<Expense>;
}
