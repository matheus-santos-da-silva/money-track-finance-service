import { GetExpensesResponseDTO } from "./get-expenses-response-DTO";

export interface GetExpenseByIdResponseDTO extends GetExpensesResponseDTO {
  user_id: string;
}
