import { UpdateTransactionDTO } from "src/domain/DTO/transactions/update-transaction-DTO";
import { assertCanWrite } from "src/shared/transactions/plan-policy";
import { prepareUpdate } from "src/shared/transactions/update-rules";
import { UpdateExpenseDTO } from "src/domain/DTO/expenses/update-expense-DTO";
import { UpdateExpenseProtocol } from "src/domain/use-cases-protocol/expenses/update-expense";
import { ensureCategoryForKind } from "src/application/services/ensure-category-for-kind";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { RecurringSeriesRepositoryProtocol } from "src/infra/database/repositories/recurring-series/protocols/recurring-series-repository-protocol";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class UpdateExpenseUseCase implements UpdateExpenseProtocol {
  constructor(
    private readonly repository: ExpensesRepositoryProtocol,
    private readonly categoryRepository: CategoriesRepositoryProtocol,
    private readonly usersRepository: UsersRepositoryProtocol,
    private readonly seriesRepository: RecurringSeriesRepositoryProtocol,
  ) {}

  async update({ id, user_id, data }: UpdateExpenseDTO): Promise<void> {
    const expense = await this.repository.findById(id);

    if (!expense) throw new BadRequestException("Despesa não existe!");
    if (expense.user_id !== user_id) {
      throw new ForbiddenException(
        "Esta despesa possui outro dono, tente novamente com outra!",
      );
    }

    // Plano gratuito com trial vencido é somente leitura.
    const user = await this.usersRepository.find(user_id);
    if (!user) throw new BadRequestException("Usuário não existe!");
    assertCanWrite(user, "editar uma despesa");

    const { scope, changes } = prepareUpdate(expense, data as UpdateTransactionDTO);

    if (changes.category_id && changes.category_id !== expense.category_id) {
      await ensureCategoryForKind(
        this.categoryRepository,
        user_id,
        changes.category_id,
        "EXPENSE",
      );
    }

    if (scope === "series") {
      // "Esta e as seguintes": o molde da série também muda, para as próximas ocorrências.
      await this.seriesRepository.updateFollowing({
        user_id,
        series_id: expense.recurrence_series_id,
        kind: "EXPENSE",
        from_date: expense.transaction_date,
        changes: {
          amount: changes.amount,
          category_id: changes.category_id,
          description: changes.description,
        },
      });
    } else if (scope === "installments") {
      await this.repository.updateByInstallmentsGroupId(
        expense.installment_group_id,
        user_id,
        changes,
      );
    } else {
      await this.repository.update(id, changes);
    }
  }
}
