import {
  StatementCursor,
  StatementMode,
  StatementSortSpec,
  StatementType,
} from "src/shared/transactions/statement";
import {
  StatementDayTotalDTO,
  StatementItemDTO,
  StatementTotalsDTO,
} from "src/domain/DTO/transactions/get-statement-response-DTO";

export interface StatementFilters {
  user_id: string;
  start_date: Date;
  end_date: Date;
  type?: StatementType;
  category_ids?: string[];
  min_amount?: number;
  max_amount?: number;
  modes?: StatementMode[];
  search?: string;
}

export abstract class StatementRepositoryProtocol {
  // Despesas e receitas numa lista só, a partir do cursor (ou do início).
  abstract findPage(
    filters: StatementFilters,
    sort: StatementSortSpec,
    cursor: StatementCursor | null,
    take: number,
  ): Promise<StatementItemDTO[]>;

  abstract totals(filters: StatementFilters): Promise<StatementTotalsDTO>;

  // Total líquido por dia de calendário dentro do período dos filtros.
  abstract dayTotals(filters: StatementFilters): Promise<StatementDayTotalDTO[]>;
}
