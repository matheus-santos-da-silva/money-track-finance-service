import { UpdateIncomeDTO } from "src/domain/DTO/incomes/update-income-DTO";
import { UpdateIncomeProtocol } from "src/domain/use-cases-protocol/incomes/update-income";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class UpdateIncomeUseCase implements UpdateIncomeProtocol {
  constructor(private readonly repository: IncomesRepositoryProtocol) {}

  async update({ id, user_id, data }: UpdateIncomeDTO): Promise<void> {
    try {
      const income = await this.repository.findById(id);

      if (!income) throw new BadRequestException("Receita não existe!");
      if (income.user_id !== user_id) {
        throw new UnauthorizedException(
          "Esta receita possui outro dono, tente novamente com outra!"
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
