import { Decimal } from "@prisma/client/runtime/library";

export interface CreateIncomeResponseDTO {
  amount: Decimal | number;
  category_id: string;
  description?: string;
  id: string;
  total_installments: number;
}
