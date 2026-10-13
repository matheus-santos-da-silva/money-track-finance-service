import { UpdateTransactionDTO } from "src/domain/DTO/transactions/update-transaction-DTO";
import { assertCanWrite } from "src/shared/transactions/plan-policy";
import { prepareUpdate } from "src/shared/transactions/update-rules";
import { UpdateIncomeDTO } from "src/domain/DTO/incomes/update-income-DTO";
import { UpdateIncomeProtocol } from "src/domain/use-cases-protocol/incomes/update-income";
import { ensureCategoryForKind } from "src/application/services/ensure-category-for-kind";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { RecurringSeriesRepositoryProtocol } from "src/infra/database/repositories/recurring-series/protocols/recurring-series-repository-protocol";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class UpdateIncomeUseCase implements UpdateIncomeProtocol {
  constructor(
    private readonly repository: IncomesRepositoryProtocol,
    private readonly categoryRepository: CategoriesRepositoryProtocol,
    private readonly usersRepository: UsersRepositoryProtocol,
    private readonly seriesRepository: RecurringSeriesRepositoryProtocol,
  ) {}

  async update({ id, user_id, data }: UpdateIncomeDTO): Promise<void> {
    const income = await this.repository.findById(id);

    if (!income) throw new BadRequestException("Receita não existe!");
    if (income.user_id !== user_id) {
      throw new ForbiddenException(
        "Esta receita possui outro dono, tente novamente com outra!",
      );
    }

    // Plano gratuito com trial vencido é somente leitura.
    const user = await this.usersRepository.find(user_id);
    if (!user) throw new BadRequestException("Usuário não existe!");
    assertCanWrite(user, "editar uma receita");

    const { scope, changes } = prepareUpdate(income, data as UpdateTransactionDTO);

    if (changes.category_id && changes.category_id !== income.category_id) {
      await ensureCategoryForKind(
        this.categoryRepository,
        user_id,
        changes.category_id,
        "INCOME",
      );
    }

    if (scope === "series") {
      // "Esta e as seguintes": o molde da série também muda, para as próximas ocorrências.
      await this.seriesRepository.updateFollowing({
        user_id,
        series_id: income.recurrence_series_id,
        kind: "INCOME",
        from_date: income.transaction_date,
        changes: {
          amount: changes.amount,
          category_id: changes.category_id,
          description: changes.description,
        },
      });
    } else if (scope === "installments") {
      await this.repository.updateByInstallmentsGroupId(
        income.installment_group_id,
        user_id,
        changes,
      );
    } else {
      await this.repository.update(id, changes);
    }
  }
}
