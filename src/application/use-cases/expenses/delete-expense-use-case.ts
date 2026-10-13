import { DeleteExpenseDTO } from "src/domain/DTO/expenses/delete-expense-DTO";
import { DeleteExpenseProtocol } from "src/domain/use-cases-protocol/expenses";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { RecurringSeriesRepositoryProtocol } from "src/infra/database/repositories/recurring-series/protocols/recurring-series-repository-protocol";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class DeleteExpenseUseCase implements DeleteExpenseProtocol {
  constructor(
    private readonly repository: ExpensesRepositoryProtocol,
    private readonly seriesRepository: RecurringSeriesRepositoryProtocol,
  ) {}

  // Excluir continua permitido mesmo no plano gratuito vencido: o usuário não fica
  // refém dos próprios dados.
  async delete({ id, user_id, applyToAll }: DeleteExpenseDTO): Promise<void> {
    const expense = await this.repository.findById(id);
    if (!expense) throw new BadRequestException("Despesa não existe!");
    if (expense.user_id !== user_id) {
      throw new ForbiddenException(
        "Esta despesa possui outro dono, tente novamente com outra!",
      );
    }

    if (applyToAll && expense.recurrence_series_id) {
      // "Esta e as seguintes": remove daqui em diante e encerra a série.
      await this.seriesRepository.deleteFollowing({
        user_id,
        series_id: expense.recurrence_series_id,
        kind: "EXPENSE",
        from_date: expense.transaction_date,
      });
    } else if (applyToAll && expense.installment_group_id) {
      await this.repository.deleteByInstallmentsGroupId(
        expense.installment_group_id,
        user_id,
      );
    } else {
      await this.repository.delete(id);
    }
  }
}
