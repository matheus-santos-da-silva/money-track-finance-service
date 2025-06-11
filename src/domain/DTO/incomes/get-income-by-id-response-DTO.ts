import { GetIncomesResponseDTO } from "./get-incomes-response-DTO";

export interface GetIncomeByIdResponseDTO extends GetIncomesResponseDTO {
  user_id: string;
}
