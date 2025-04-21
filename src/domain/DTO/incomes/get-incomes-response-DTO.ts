import { Decimal } from "@prisma/client/runtime/library";

export interface GetIncomesResponseDTO {
  amount: Decimal | number;
  category_id: string;
  description?: string;
  id: string;
  total_installments: number;
  recurrence: string;
}
