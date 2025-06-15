import { UpdateIncomeDTO } from "src/domain/DTO/incomes/update-income-DTO";

export abstract class UpdateIncomeProtocol {
  abstract update(data: UpdateIncomeDTO): Promise<void>;
}
