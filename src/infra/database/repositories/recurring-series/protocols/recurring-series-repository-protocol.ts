import { CategoryType, Prisma, Recurrence } from "@prisma/client";

export interface RecurringSeriesRecord {
  id: string;
  user_id: string;
  kind: CategoryType;
  frequency: Recurrence;
  anchor_date: Date;
  category_id: string;
  amount: Prisma.Decimal;
  description: string | null;
  generated_until: Date;
}

export interface CreateRecurringSeriesInput {
  user_id: string;
  kind: CategoryType;
  frequency: Recurrence;
  anchor_date: Date;
  category_id: string;
  amount: Prisma.Decimal;
  description?: string;
}

export interface FirstOccurrence {
  id: string;
  amount: Prisma.Decimal | number;
  category_id: string;
  description?: string | null;
  total_installments: number;
  current_installment: number;
}

export interface SeriesChanges {
  amount?: Prisma.Decimal | number;
  category_id?: string;
  description?: string;
}

export interface FollowingScope {
  user_id: string;
  series_id: string;
  kind: CategoryType;
  from_date: Date;
}

export abstract class RecurringSeriesRepositoryProtocol {
  // Cria a série e a 1ª ocorrência na mesma transação.
  abstract createWithFirstOccurrence(
    data: CreateRecurringSeriesInput,
  ): Promise<FirstOccurrence>;

  abstract findActiveByUser(user_id: string): Promise<RecurringSeriesRecord[]>;

  // Grava as ocorrências que faltam (idempotente) e avança generated_until.
  abstract appendOccurrences(
    series: RecurringSeriesRecord,
    dates: Date[],
  ): Promise<void>;

  // "Esta e as seguintes": altera as ocorrências a partir de from_date e o molde da
  // série (usado nas próximas ocorrências geradas).
  abstract updateFollowing(
    scope: FollowingScope & { changes: SeriesChanges },
  ): Promise<void>;

  // Exclui as ocorrências a partir de from_date e encerra a série (ou a remove, se
  // não sobrar nenhuma ocorrência).
  abstract deleteFollowing(scope: FollowingScope): Promise<void>;
}
