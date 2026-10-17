import { Prisma } from "@prisma/client";
import { GetStatementProtocol } from "src/domain/use-cases-protocol/transactions/get-statement";
import { GetStatementQueryDTO } from "src/domain/DTO/transactions/get-statement-query-DTO";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { MaterializeRecurrencesService } from "src/application/services/materialize-recurrences.service";
import { BadRequestException, Injectable } from "@nestjs/common";
import {
  GetStatementResponseDTO,
  StatementItemDTO,
} from "src/domain/DTO/transactions/get-statement-response-DTO";
import {
  StatementFilters,
  StatementRepositoryProtocol,
} from "src/infra/database/repositories/statement/protocols/statement-repository-protocol";
import {
  decodeCursor,
  encodeCursor,
  sortSpec,
} from "src/shared/transactions/statement";
import {
  endOfCalendarDay,
  startOfCalendarDay,
  toCalendarDate,
} from "src/shared/transactions/calendar-date";

const subtract = (a: number, b: number) =>
  new Prisma.Decimal(a).minus(b).toNumber();

@Injectable()
export class GetStatementUseCase implements GetStatementProtocol {
  constructor(
    private readonly statementRepository: StatementRepositoryProtocol,
    private readonly usersRepository: UsersRepositoryProtocol,
    private readonly materializeRecurrences: MaterializeRecurrencesService,
  ) {}

  async find(
    user_id: string,
    query: GetStatementQueryDTO,
  ): Promise<GetStatementResponseDTO> {
    const { sort, limit, min_amount, max_amount } = query;

    const start_date = startOfCalendarDay(toCalendarDate(query.start_date));
    const end_date = endOfCalendarDay(toCalendarDate(query.end_date));

    if (start_date > end_date) {
      throw new BadRequestException(
        "A data inicial não pode ser depois da data final.",
      );
    }

    if (
      min_amount !== undefined &&
      max_amount !== undefined &&
      min_amount > max_amount
    ) {
      throw new BadRequestException(
        "O valor mínimo não pode ser maior que o valor máximo.",
      );
    }

    const cursor = query.cursor ? decodeCursor(query.cursor, sort) : null;

    const user = await this.usersRepository.find(user_id);
    if (!user) throw new BadRequestException("Usuário não existe!");

    // Cria as ocorrências recorrentes que faltam até o fim do período consultado.
    await this.materializeRecurrences.run(user_id, end_date);

    const period = { user_id, start_date, end_date };
    const filters: StatementFilters = {
      ...period,
      type: query.type,
      category_ids: query.category_ids,
      min_amount,
      max_amount,
      modes: query.modes,
      search: query.search || undefined,
    };
    const order = sortSpec(sort);

    // Um item a mais só para saber se existe próxima página.
    const rows = await this.statementRepository.findPage(
      filters,
      order,
      cursor,
      limit + 1,
    );
    const items = rows.slice(0, limit);
    const hasNextPage = rows.length > limit;

    const response: GetStatementResponseDTO = {
      items,
      next_cursor: hasNextPage
        ? encodeCursor(sort, items[items.length - 1])
        : null,
      days:
        order.field === "transaction_date"
          ? await this.dayTotals(filters, items)
          : [],
    };

    // Os totais não mudam entre as páginas: só a primeira os calcula.
    if (!cursor) {
      const [periodTotals, filteredTotals] = await Promise.all([
        this.statementRepository.totals(period),
        this.statementRepository.totals(filters),
      ]);

      response.summary = {
        incomes: periodTotals.incomes,
        expenses: periodTotals.expenses,
        balance: subtract(periodTotals.incomes, periodTotals.expenses),
      };
      response.filtered = {
        count: filteredTotals.count,
        total: subtract(filteredTotals.incomes, filteredTotals.expenses),
      };
    }

    return response;
  }

  // Total de cada dia da página inteira, mesmo que o dia continue na página seguinte.
  // Ordenada por data, a página cobre um intervalo contínuo de dias.
  private async dayTotals(filters: StatementFilters, items: StatementItemDTO[]) {
    if (items.length === 0) return [];

    const times = items.map((item) => item.transaction_date.getTime());

    return this.statementRepository.dayTotals({
      ...filters,
      start_date: startOfCalendarDay(new Date(Math.min(...times))),
      end_date: endOfCalendarDay(new Date(Math.max(...times))),
    });
  }
}
