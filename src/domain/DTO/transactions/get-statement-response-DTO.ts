import { StatementType } from "src/shared/transactions/statement";
import { CategoryResponseDTO } from "../categories/category-response-dto";

export interface StatementItemDTO {
  id: string;
  type: StatementType;
  amount: number;
  description?: string | null;
  category_id: string;
  category: CategoryResponseDTO;
  total_installments: number;
  current_installment: number;
  installment_group_id?: string | null;
  recurrence: string;
  transaction_date: Date;
}

export interface StatementTotalsDTO {
  incomes: number;
  expenses: number;
  count: number;
}

export interface StatementDayTotalDTO {
  // AAAA-MM-DD
  date: string;
  // Receitas menos despesas do dia, considerando os filtros.
  total: number;
}

export interface GetStatementResponseDTO {
  items: StatementItemDTO[];
  // null quando não há mais páginas.
  next_cursor: string | null;
  // Totais líquidos dos dias presentes na página (vazio ao ordenar por valor).
  days: StatementDayTotalDTO[];
  // Só na primeira página (sem cursor): o período inteiro, sem os demais filtros.
  summary?: { incomes: number; expenses: number; balance: number };
  // Só na primeira página: tudo o que os filtros retornam.
  filtered?: { count: number; total: number };
}
