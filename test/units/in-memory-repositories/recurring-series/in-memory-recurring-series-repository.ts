import { randomUUID } from "node:crypto";
import { CategoryType } from "@prisma/client";
import { InMemoryExpensesRepository } from "../expenses/in-memory-expenses-repository";
import { InMemoryIncomesRepository } from "../incomes/in-memory-incomes-repository";
import {
  CreateRecurringSeriesInput,
  FirstOccurrence,
  FollowingScope,
  RecurringSeriesRecord,
  RecurringSeriesRepositoryProtocol,
  SeriesChanges,
} from "src/infra/database/repositories/recurring-series/protocols/recurring-series-repository-protocol";

type StoredSeries = RecurringSeriesRecord & { active: boolean };

// Espelha o comportamento do repositório real sobre os repositórios em memória de
// despesas e receitas (as "tabelas").
export class InMemoryRecurringSeriesRepository
  implements RecurringSeriesRepositoryProtocol
{
  series: StoredSeries[] = [];

  constructor(
    private readonly expenses?: InMemoryExpensesRepository,
    private readonly incomes?: InMemoryIncomesRepository,
  ) {}

  private rows(kind: CategoryType): any[] {
    return kind === "EXPENSE" ? this.expenses.expenses : this.incomes.incomes;
  }

  private setRows(kind: CategoryType, rows: any[]) {
    if (kind === "EXPENSE") this.expenses.expenses = rows;
    else this.incomes.incomes = rows;
  }

  private createRow(kind: CategoryType, data: any) {
    return kind === "EXPENSE"
      ? this.expenses.create(data)
      : this.incomes.create(data);
  }

  async createWithFirstOccurrence(
    data: CreateRecurringSeriesInput,
  ): Promise<FirstOccurrence> {
    const id = randomUUID();
    this.series.push({
      id,
      user_id: data.user_id,
      kind: data.kind,
      frequency: data.frequency,
      anchor_date: data.anchor_date,
      category_id: data.category_id,
      amount: data.amount,
      description: data.description ?? null,
      generated_until: data.anchor_date,
      active: true,
    });

    return this.createRow(data.kind, {
      user_id: data.user_id,
      category_id: data.category_id,
      amount: data.amount,
      description: data.description,
      recurrence: data.frequency,
      total_installments: 1,
      current_installment: 1,
      transaction_date: data.anchor_date,
      recurrence_series_id: id,
    });
  }

  async findActiveByUser(user_id: string): Promise<RecurringSeriesRecord[]> {
    return this.series.filter((s) => s.user_id === user_id && s.active);
  }

  async appendOccurrences(
    series: RecurringSeriesRecord,
    dates: Date[],
  ): Promise<void> {
    if (dates.length === 0) return;

    for (const transaction_date of dates) {
      const duplicated = this.rows(series.kind).some(
        (row) =>
          row.recurrence_series_id === series.id &&
          row.transaction_date.getTime() === transaction_date.getTime(),
      );
      if (duplicated) continue; // skipDuplicates

      await this.createRow(series.kind, {
        user_id: series.user_id,
        category_id: series.category_id,
        amount: series.amount,
        description: series.description ?? undefined,
        recurrence: series.frequency,
        total_installments: 1,
        current_installment: 1,
        transaction_date,
        recurrence_series_id: series.id,
      });
    }

    const last = dates[dates.length - 1];
    const stored = this.series.find((s) => s.id === series.id);
    if (stored && stored.generated_until < last) stored.generated_until = last;
  }

  async updateFollowing({
    user_id,
    series_id,
    kind,
    from_date,
    changes,
  }: FollowingScope & { changes: SeriesChanges }): Promise<void> {
    const defined = Object.fromEntries(
      Object.entries(changes).filter(([, value]) => value !== undefined),
    );

    this.setRows(
      kind,
      this.rows(kind).map((row) =>
        row.user_id === user_id &&
        row.recurrence_series_id === series_id &&
        row.transaction_date >= from_date
          ? { ...row, ...defined }
          : row,
      ),
    );

    const stored = this.series.find((s) => s.id === series_id && s.user_id === user_id);
    if (stored) Object.assign(stored, defined);
  }

  async deleteFollowing({
    user_id,
    series_id,
    kind,
    from_date,
  }: FollowingScope): Promise<void> {
    this.setRows(
      kind,
      this.rows(kind).filter(
        (row) =>
          !(
            row.user_id === user_id &&
            row.recurrence_series_id === series_id &&
            row.transaction_date >= from_date
          ),
      ),
    );

    const remaining = this.rows(kind).filter(
      (row) => row.recurrence_series_id === series_id,
    ).length;

    if (remaining === 0) {
      this.series = this.series.filter((s) => s.id !== series_id);
    } else {
      const stored = this.series.find((s) => s.id === series_id);
      if (stored) stored.active = false;
    }
  }
}
