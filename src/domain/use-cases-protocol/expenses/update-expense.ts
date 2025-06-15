import { UpdateExpenseDTO } from "src/domain/DTO/expenses/update-expense-DTO";

export abstract class UpdateExpenseProtocol {
  abstract update(data: UpdateExpenseDTO): Promise<void>;
}
