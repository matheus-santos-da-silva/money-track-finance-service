import { Prisma } from "@prisma/client";
import { PrismaService } from "../../config/prisma.service";
import { calendarDayKey } from "src/shared/transactions/calendar-date";
import { BadRequestException, Injectable } from "@nestjs/common";
import {
  mergeStatementPages,
  StatementCursor,
  StatementMode,
  StatementSortSpec,
  StatementType,
  TIE_ORDER,
} from "src/shared/transactions/statement";
import {
  StatementDayTotalDTO,
  StatementItemDTO,
  StatementTotalsDTO,
} from "src/domain/DTO/transactions/get-statement-response-DTO";
import {
  StatementFilters,
  StatementRepositoryProtocol,
} from "./protocols/statement-repository-protocol";

// expenses e incomes têm as mesmas colunas: os filtros são montados uma vez, no formato
// de expenses, e servem às duas tabelas.
type TransactionWhere = Prisma.ExpenseWhereInput;

const ITEM_SELECT = {
  id: true,
  amount: true,
  description: true,
  category_id: true,
  total_installments: true,
  current_installment: true,
  installment_group_id: true,
  recurrence: true,
  transaction_date: true,
  category: { select: { name: true, icon: true } },
} satisfies Prisma.ExpenseSelect;

type TransactionRow = Prisma.ExpenseGetPayload<{ select: typeof ITEM_SELECT }>;

const MODE_WHERE: Record<StatementMode, TransactionWhere> = {
  [StatementMode.SINGLE]: { total_installments: 1, recurrence: "NONE" },
  [StatementMode.INSTALLMENT]: { total_installments: { gt: 1 } },
  [StatementMode.RECURRING]: { recurrence: { not: "NONE" } },
};

const filtersWhere = ({
  user_id,
  start_date,
  end_date,
  category_ids,
  min_amount,
  max_amount,
  modes,
  search,
}: StatementFilters): TransactionWhere => {
  const conditions: TransactionWhere[] = [];

  if (modes?.length) {
    conditions.push({ OR: modes.map((mode) => MODE_WHERE[mode]) });
  }

  if (search) {
    const contains = { contains: search, mode: "insensitive" as const };
    conditions.push({
      OR: [{ description: contains }, { category: { name: contains } }],
    });
  }

  return {
    user_id,
    transaction_date: { gte: start_date, lte: end_date },
    ...(category_ids?.length && { category_id: { in: category_ids } }),
    ...((min_amount !== undefined || max_amount !== undefined) && {
      amount: { gte: min_amount, lte: max_amount },
    }),
    AND: conditions,
  };
};

// O que vem depois do cursor na tabela `type`. Na tabela do próprio cursor o desempate
// é pelo id; na outra, pela ordem fixa entre tipos (TIE_ORDER).
const cursorWhere = (
  type: StatementType,
  cursor: StatementCursor,
  { field, direction }: StatementSortSpec,
): TransactionWhere => {
  const after = direction === "desc" ? "lt" : "gt";
  const afterOrEqual = direction === "desc" ? "lte" : "gte";
  const value =
    field === "amount"
      ? new Prisma.Decimal(cursor.value)
      : new Date(cursor.value);

  if (type === cursor.type) {
    return {
      OR: [
        { [field]: { [after]: value } },
        { [field]: value, id: { [after]: cursor.id } },
      ],
    };
  }

  const comesAfterCursorTypeOnTie =
    TIE_ORDER.indexOf(type) > TIE_ORDER.indexOf(cursor.type);

  return {
    [field]: { [comesAfterCursorTypeOnTie ? afterOrEqual : after]: value },
  };
};

const toItem =
  (type: StatementType) =>
  (row: TransactionRow): StatementItemDTO => ({
    ...row,
    type,
    amount: row.amount.toNumber(),
  });

@Injectable()
export class StatementRepository implements StatementRepositoryProtocol {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(
    filters: StatementFilters,
    sort: StatementSortSpec,
    cursor: StatementCursor | null,
    take: number,
  ): Promise<StatementItemDTO[]> {
    try {
      const [expenses, incomes] = await Promise.all(
        TIE_ORDER.map(async (type) => {
          if (!this.includes(filters, type)) return [];

          const rows = await this.table(type).findMany({
            where: {
              AND: [
                filtersWhere(filters),
                cursor ? cursorWhere(type, cursor, sort) : {},
              ],
            },
            orderBy: [{ [sort.field]: sort.direction }, { id: sort.direction }],
            take,
            select: ITEM_SELECT,
          });

          return rows.map(toItem(type));
        }),
      );

      return mergeStatementPages(expenses, incomes, sort).slice(0, take);
    } catch (error) {
      throw new BadRequestException(
        "Erro ao retornar o extrato, tente novamente!",
      );
    }
  }

  async totals(filters: StatementFilters): Promise<StatementTotalsDTO> {
    try {
      const [expenses, incomes] = await Promise.all(
        TIE_ORDER.map(async (type) => {
          if (!this.includes(filters, type)) return { amount: 0, count: 0 };

          const where = filtersWhere(filters);
          const [{ _sum }, count] = await Promise.all([
            this.table(type).aggregate({ where, _sum: { amount: true } }),
            this.table(type).count({ where }),
          ]);

          return { amount: _sum.amount?.toNumber() ?? 0, count };
        }),
      );

      return {
        expenses: expenses.amount,
        incomes: incomes.amount,
        count: expenses.count + incomes.count,
      };
    } catch (error) {
      throw new BadRequestException(
        "Erro ao calcular os totais do extrato, tente novamente!",
      );
    }
  }

  async dayTotals(filters: StatementFilters): Promise<StatementDayTotalDTO[]> {
    try {
      const [expenses, incomes] = await Promise.all(
        TIE_ORDER.map((type) =>
          this.includes(filters, type)
            ? this.table(type).groupBy({
                by: ["transaction_date"],
                where: filtersWhere(filters),
                _sum: { amount: true },
              })
            : [],
        ),
      );

      const zero = new Prisma.Decimal(0);
      const totalByDay = new Map<string, Prisma.Decimal>();
      const add = (date: Date, amount: Prisma.Decimal) => {
        const day = calendarDayKey(date);
        totalByDay.set(day, (totalByDay.get(day) ?? zero).plus(amount));
      };

      for (const { transaction_date, _sum } of incomes) {
        add(transaction_date, _sum.amount ?? zero);
      }
      for (const { transaction_date, _sum } of expenses) {
        add(transaction_date, (_sum.amount ?? zero).negated());
      }

      return [...totalByDay].map(([date, total]) => ({
        date,
        total: total.toNumber(),
      }));
    } catch (error) {
      throw new BadRequestException(
        "Erro ao calcular os totais por dia, tente novamente!",
      );
    }
  }

  private includes(filters: StatementFilters, type: StatementType): boolean {
    return !filters.type || filters.type === type;
  }

  // As duas tabelas têm as mesmas colunas e relações; a de receitas é consultada com
  // os tipos da de despesas para a consulta ser escrita uma vez só.
  private table(type: StatementType): PrismaService["expense"] {
    return type === StatementType.EXPENSE
      ? this.prisma.expense
      : (this.prisma.income as unknown as PrismaService["expense"]);
  }
}
