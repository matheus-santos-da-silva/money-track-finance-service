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

      const { applyToAll, ...withoutApplyToAll } = data;

      if (applyToAll) {
        if (!withoutApplyToAll.installment_group_id) {
          throw new BadRequestException(
            "Não foi possível alterar o parcelamento de todas as parcelas, tente novamente!"
          );
        }

        if (withoutApplyToAll.transaction_date) {
          throw new BadRequestException(
            "Não é possível alterar a data de todas as parcelas. Altere individualmente ou refaça o parcelamento."
          );
        }

        if (
          withoutApplyToAll.recurrence ||
          withoutApplyToAll.total_installments
        ) {
          throw new BadRequestException(
            "Não é permitido alterar a recorrência ou o parcelamento de uma transação já existente."
          );
        }

        await this.repository.updateByInstallmentsGroupId(
          withoutApplyToAll.installment_group_id,
          withoutApplyToAll
        );
      } else {
        await this.repository.update(id, withoutApplyToAll);
      }
    } catch (error) {
      throw error;
    }
  }
}
