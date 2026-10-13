import { Prisma } from "@prisma/client";
import { PrismaService } from "../../config/prisma.service";
import { BadRequestException, Injectable } from "@nestjs/common";
import {
  CreateRecurringSeriesInput,
  FirstOccurrence,
  FollowingScope,
  RecurringSeriesRecord,
  RecurringSeriesRepositoryProtocol,
  SeriesChanges,
} from "./protocols/recurring-series-repository-protocol";

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class RecurringSeriesRepository
  implements RecurringSeriesRepositoryProtocol
{
  constructor(private readonly prisma: PrismaService) {}

  // expenses e incomes têm o mesmo formato; escolhe a tabela pelo tipo da série.
  private rowsOf(client: TransactionClient, kind: "EXPENSE" | "INCOME") {
    return (
      kind === "EXPENSE" ? client.expense : client.income
    ) as unknown as TransactionClient["expense"];
  }

  async createWithFirstOccurrence(
    data: CreateRecurringSeriesInput,
  ): Promise<FirstOccurrence> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const series = await tx.recurringSeries.create({
          data: {
            user_id: data.user_id,
            kind: data.kind,
            frequency: data.frequency,
            anchor_date: data.anchor_date,
            category_id: data.category_id,
            amount: data.amount,
            description: data.description,
            generated_until: data.anchor_date,
          },
        });

        return this.rowsOf(tx, data.kind).create({
          data: {
            user_id: data.user_id,
            category_id: data.category_id,
            amount: data.amount,
            description: data.description,
            recurrence: data.frequency,
            total_installments: 1,
            current_installment: 1,
            transaction_date: data.anchor_date,
            recurrence_series_id: series.id,
          },
          select: {
            id: true,
            amount: true,
            category_id: true,
            description: true,
            total_installments: true,
            current_installment: true,
          },
        });
      });
    } catch (error) {
      throw new BadRequestException(
        "Erro ao criar a transação recorrente, tente novamente!",
      );
    }
  }

  async findActiveByUser(user_id: string): Promise<RecurringSeriesRecord[]> {
    return this.prisma.recurringSeries.findMany({
      where: { user_id, active: true },
      select: {
        id: true,
        user_id: true,
        kind: true,
        frequency: true,
        anchor_date: true,
        category_id: true,
        amount: true,
        description: true,
        generated_until: true,
      },
    });
  }

  async appendOccurrences(
    series: RecurringSeriesRecord,
    dates: Date[],
  ): Promise<void> {
    if (dates.length === 0) return;
    const lastDate = dates[dates.length - 1];

    try {
      await this.prisma.$transaction(async (tx) => {
        // skipDuplicates + índice único (série, data): duas requisições simultâneas
        await this.rowsOf(tx, series.kind).createMany({
          data: dates.map((transaction_date) => ({
            user_id: series.user_id,
            category_id: series.category_id,
            amount: series.amount,
            description: series.description ?? undefined,
            recurrence: series.frequency,
            total_installments: 1,
            current_installment: 1,
            transaction_date,
            recurrence_series_id: series.id,
          })),
          skipDuplicates: true,
        });

        // generated_until só avança: ocorrências excluídas pelo usuário não voltam.
        await tx.recurringSeries.updateMany({
          where: { id: series.id, generated_until: { lt: lastDate } },
          data: { generated_until: lastDate },
        });
      });
    } catch (error) {
      throw new BadRequestException(
        "Erro ao gerar as ocorrências recorrentes, tente novamente!",
      );
    }
  }

  async updateFollowing({
    user_id,
    series_id,
    kind,
    from_date,
    changes,
  }: FollowingScope & { changes: SeriesChanges }): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.rowsOf(tx, kind).updateMany({
          where: {
            user_id,
            recurrence_series_id: series_id,
            transaction_date: { gte: from_date },
          },
          data: changes,
        });

        await tx.recurringSeries.updateMany({
          where: { id: series_id, user_id },
          data: changes,
        });
      });
    } catch (error) {
      throw new BadRequestException(
        "Erro ao atualizar as transações recorrentes, tente novamente!",
      );
    }
  }

  async deleteFollowing({
    user_id,
    series_id,
    kind,
    from_date,
  }: FollowingScope): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const rows = this.rowsOf(tx, kind);

        await rows.deleteMany({
          where: {
            user_id,
            recurrence_series_id: series_id,
            transaction_date: { gte: from_date },
          },
        });

        const remaining = await rows.count({
          where: { recurrence_series_id: series_id },
        });

        if (remaining === 0) {
          await tx.recurringSeries.deleteMany({ where: { id: series_id, user_id } });
        } else {
          await tx.recurringSeries.updateMany({
            where: { id: series_id, user_id },
            data: { active: false },
          });
        }
      });
    } catch (error) {
      throw new BadRequestException(
        "Erro ao excluir as transações recorrentes, tente novamente!",
      );
    }
  }
}
