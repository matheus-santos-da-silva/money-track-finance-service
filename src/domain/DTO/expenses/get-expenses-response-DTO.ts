import { Decimal } from "@prisma/client/runtime/library";

export interface GetExpensesResponseDTO {
  amount: Decimal;
  category_id: string;
  description?: string;
  id: string;
  total_installments: number;
  recurrence: string;
}
