import { GetExpensesResponseDTO } from "src/domain/DTO/expenses/get-expenses-response-DTO";

export abstract class GetExpenseByIdProtocol {
  abstract findById(id: string, user_id: string): Promise<GetExpensesResponseDTO>;
}
