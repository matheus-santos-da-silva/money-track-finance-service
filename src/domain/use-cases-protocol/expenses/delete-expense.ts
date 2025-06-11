import { DeleteExpenseDTO } from "src/domain/DTO/expenses/delete-expense-DTO";

export abstract class DeleteExpenseProtocol {
  abstract delete(data: DeleteExpenseDTO): Promise<void>;
}
