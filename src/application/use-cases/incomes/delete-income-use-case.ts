import { DeleteIncomeDTO } from "src/domain/DTO/incomes/delete-income-DTO";
import { DeleteIncomeProtocol } from "src/domain/use-cases-protocol/incomes";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { RecurringSeriesRepositoryProtocol } from "src/infra/database/repositories/recurring-series/protocols/recurring-series-repository-protocol";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class DeleteIncomeUseCase implements DeleteIncomeProtocol {
  constructor(
    private readonly repository: IncomesRepositoryProtocol,
    private readonly seriesRepository: RecurringSeriesRepositoryProtocol,
  ) {}

  // Excluir continua permitido mesmo no plano gratuito vencido: o usuário não fica
  // refém dos próprios dados.
  async delete({ id, user_id, applyToAll }: DeleteIncomeDTO): Promise<void> {
    const income = await this.repository.findById(id);
    if (!income) throw new BadRequestException("Receita não existe!");
    if (income.user_id !== user_id) {
      throw new ForbiddenException(
        "Esta receita possui outro dono, tente novamente com outra!",
      );
    }

    if (applyToAll && income.recurrence_series_id) {
      // "Esta e as seguintes": remove daqui em diante e encerra a série.
      await this.seriesRepository.deleteFollowing({
        user_id,
        series_id: income.recurrence_series_id,
        kind: "INCOME",
        from_date: income.transaction_date,
      });
    } else if (applyToAll && income.installment_group_id) {
      await this.repository.deleteByInstallmentsGroupId(
        income.installment_group_id,
        user_id,
      );
    } else {
      await this.repository.delete(id);
    }
  }
}
