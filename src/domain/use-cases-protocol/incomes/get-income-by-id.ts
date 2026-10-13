import { GetIncomesResponseDTO } from "src/domain/DTO/incomes/get-incomes-response-DTO";

export abstract class GetIncomeByIdProtocol {
  abstract findById(id: string, user_id: string): Promise<GetIncomesResponseDTO>;
}
