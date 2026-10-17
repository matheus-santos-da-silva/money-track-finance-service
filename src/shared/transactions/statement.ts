import { BadRequestException } from "@nestjs/common";

export enum StatementType {
  EXPENSE = "EXPENSE",
  INCOME = "INCOME",
}

export enum StatementSort {
  DATE_DESC = "DATE_DESC",
  DATE_ASC = "DATE_ASC",
  AMOUNT_DESC = "AMOUNT_DESC",
  AMOUNT_ASC = "AMOUNT_ASC",
}

// À vista (sem parcelas nem recorrência), parcelada ou recorrente.
export enum StatementMode {
  SINGLE = "SINGLE",
  INSTALLMENT = "INSTALLMENT",
  RECURRING = "RECURRING",
}

export interface StatementSortSpec {
  field: "transaction_date" | "amount";
  direction: "asc" | "desc";
}

export const sortSpec = (sort: StatementSort): StatementSortSpec => ({
  field: sort.startsWith("DATE") ? "transaction_date" : "amount",
  direction: sort.endsWith("DESC") ? "desc" : "asc",
});

// Posição do último item de uma página: o valor do campo ordenado, o tipo e o id.
export interface StatementCursor {
  value: string;
  type: StatementType;
  id: string;
}

interface SortableItem {
  id: string;
  type: StatementType;
  amount: number;
  transaction_date: Date;
}

const sortValue = (field: StatementSortSpec["field"], item: SortableItem) =>
  field === "amount" ? String(item.amount) : item.transaction_date.toISOString();

// O cursor é opaco para o app. Guarda a ordenação para rejeitar um cursor usado com
// outra ordenação, que pularia ou repetiria itens.
export const encodeCursor = (sort: StatementSort, item: SortableItem): string =>
  Buffer.from(
    JSON.stringify({
      sort,
      value: sortValue(sortSpec(sort).field, item),
      type: item.type,
      id: item.id,
    }),
  ).toString("base64url");

const isValidValue = (field: StatementSortSpec["field"], value: unknown) =>
  typeof value === "string" &&
  (field === "amount"
    ? /^\d+(\.\d+)?$/.test(value)
    : !Number.isNaN(Date.parse(value)));

export const decodeCursor = (raw: string, sort: StatementSort): StatementCursor => {
  const invalid = new BadRequestException("Cursor de paginação inválido.");

  let parsed: Partial<StatementCursor> & { sort?: string };
  try {
    parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf-8"));
  } catch {
    throw invalid;
  }

  const { value, type, id } = parsed ?? {};
  const isValid =
    parsed?.sort === sort &&
    isValidValue(sortSpec(sort).field, value) &&
    Object.values(StatementType).includes(type) &&
    typeof id === "string" &&
    id.length > 0;

  if (!isValid) throw invalid;

  return { value, type, id };
};

// Em empate no campo ordenado, despesas vêm antes de receitas. A ordem entre as duas
// tabelas nunca compara ids: a ordenação de texto do banco pode diferir da do JavaScript.
export const TIE_ORDER = [StatementType.EXPENSE, StatementType.INCOME];

// Junta as duas listas, cada uma já ordenada pelo banco, preservando a ordem interna.
export const mergeStatementPages = <T extends SortableItem>(
  expenses: T[],
  incomes: T[],
  { field, direction }: StatementSortSpec,
): T[] => {
  const rank = (item: T) =>
    field === "amount" ? item.amount : item.transaction_date.getTime();
  const expenseGoesFirst = (expense: T, income: T) =>
    direction === "desc"
      ? rank(expense) >= rank(income)
      : rank(expense) <= rank(income);

  const merged: T[] = [];
  let e = 0;
  let i = 0;

  while (e < expenses.length && i < incomes.length) {
    merged.push(
      expenseGoesFirst(expenses[e], incomes[i]) ? expenses[e++] : incomes[i++],
    );
  }

  return [...merged, ...expenses.slice(e), ...incomes.slice(i)];
};
