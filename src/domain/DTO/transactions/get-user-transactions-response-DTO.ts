import { GetExpensesResponseDTO } from "../expenses/get-expenses-response-DTO";
import { GetIncomesResponseDTO } from "../incomes/get-incomes-response-DTO";

export interface GetUserTransactionsResponseDTO {
  expenses: GetExpensesResponseDTO[];
  incomes: GetIncomesResponseDTO[];
}
