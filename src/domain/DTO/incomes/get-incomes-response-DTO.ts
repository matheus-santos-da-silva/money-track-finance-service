import { Decimal } from "@prisma/client/runtime/library";
import { CategoryResponseDTO } from "../categories/category-response-dto";

export interface GetIncomesResponseDTO {
  amount: Decimal | number;
  category_id: string;
  description?: string;
  id: string;
  total_installments: number;
  current_installment: number;
  recurrence: string;
  category: CategoryResponseDTO;
}
