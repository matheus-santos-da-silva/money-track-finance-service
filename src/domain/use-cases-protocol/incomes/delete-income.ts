import { DeleteIncomeDTO } from "src/domain/DTO/incomes/delete-income-DTO";

export abstract class DeleteIncomeProtocol {
  abstract delete(data: DeleteIncomeDTO): Promise<void>;
}
