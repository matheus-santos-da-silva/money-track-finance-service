import { DeleteExpenseDTO } from "src/domain/DTO/expenses/delete-expense-DTO";
import { DeleteExpenseProtocol } from "src/domain/use-cases-protocol/expenses";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class DeleteExpenseUseCase implements DeleteExpenseProtocol {
  constructor(private readonly repository: ExpensesRepositoryProtocol) {}

  async delete({ id, user_id }: DeleteExpenseDTO): Promise<void> {
    try {
      const expense = await this.repository.findById(id);
      if (!expense) throw new BadRequestException("Despesa não existe!");
      if (expense.user_id !== user_id) {
        throw new UnauthorizedException(
          "Esta despesa possui outro dono, tente novamente com outra!"
        );
      }

      await this.repository.delete(id);
    } catch (error) {
      throw error;
    }
  }
}
