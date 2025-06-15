import { UpdateExpenseDTO } from "src/domain/DTO/expenses/update-expense-DTO";
import { UpdateExpenseProtocol } from "src/domain/use-cases-protocol/expenses/update-expense";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class UpdateExpenseUseCase implements UpdateExpenseProtocol {
  constructor(private readonly repository: ExpensesRepositoryProtocol) {}

  async update({ id, user_id, data }: UpdateExpenseDTO): Promise<void> {
    try {
      const expense = await this.repository.findById(id);

      if (!expense) throw new BadRequestException("Despesa não existe!");
      if (expense.user_id !== user_id) {
        throw new UnauthorizedException(
          "Esta despesa possui outro dono, tente novamente com outra!"
        );
      }

      await this.repository.update(id, data);
    } catch (error) {
      throw error;
    }
  }
}
