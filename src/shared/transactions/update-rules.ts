import { Prisma } from "@prisma/client";
import { BadRequestException } from "@nestjs/common";
import { UpdateTransactionDTO } from "src/domain/DTO/transactions/update-transaction-DTO";
import { isSameCalendarDay, toCalendarDate } from "./calendar-date";

interface ExistingTransaction {
  transaction_date: Date;
  recurrence?: string | null;
  total_installments: number;
  installment_group_id?: string | null;
  recurrence_series_id?: string | null;
}

// single: só este registro. installments: todas as parcelas do grupo.
// series: esta ocorrência e as seguintes de uma série recorrente.
export type UpdateScope = "single" | "installments" | "series";

export interface TransactionChanges {
  amount?: Prisma.Decimal | number;
  category_id?: string;
  description?: string;
  transaction_date?: Date;
}

// Valida e normaliza uma edição. O app envia o formulário inteiro (inclusive campos
// que não mudaram), então valores iguais aos atuais são ignorados em vez de rejeitados.
export const prepareUpdate = (
  existing: ExistingTransaction,
  data: UpdateTransactionDTO,
): { scope: UpdateScope; changes: TransactionChanges } => {
  // installment_group_id enviado pelo cliente é ignorado: o grupo vem sempre do
  // registro do dono.
  const {
    applyToAll,
    installment_group_id: _clientGroupId,
    recurrence,
    total_installments,
    transaction_date,
    ...changes
  } = data;

  const changesStructure =
    (recurrence !== undefined && recurrence !== (existing.recurrence ?? "NONE")) ||
    (total_installments !== undefined &&
      total_installments !== existing.total_installments);

  if (changesStructure) {
    throw new BadRequestException(
      "Não é permitido alterar a recorrência ou o parcelamento de uma transação já existente.",
    );
  }

  let scope: UpdateScope = "single";
  if (applyToAll) {
    if (existing.recurrence_series_id) scope = "series";
    else if (existing.installment_group_id) scope = "installments";
    else {
      throw new BadRequestException(
        "Não foi possível alterar o parcelamento de todas as parcelas, tente novamente!",
      );
    }
  }

  const result: TransactionChanges = { ...changes };

  if (transaction_date !== undefined) {
    const newDate = toCalendarDate(transaction_date);

    if (!isSameCalendarDay(newDate, existing.transaction_date)) {
      if (scope === "series") {
        throw new BadRequestException(
          "Não é possível alterar a data de várias ocorrências de uma vez. Altere individualmente.",
        );
      }
      if (scope === "installments") {
        throw new BadRequestException(
          "Não é possível alterar a data de todas as parcelas. Altere individualmente ou refaça o parcelamento.",
        );
      }
      result.transaction_date = newDate;
    }
  }

  return { scope, changes: result };
};
