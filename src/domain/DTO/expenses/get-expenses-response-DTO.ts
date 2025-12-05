import { Decimal } from "@prisma/client/runtime/library";
import { CategoryResponseDTO } from "../categories/category-response-dto";

export interface GetExpensesResponseDTO {
  amount: Decimal | number;
  category_id: string;
  description?: string;
  id: string;
  total_installments: number;
  current_installment: number;
  installment_group_id?: string;
  recurrence: string;
  category: CategoryResponseDTO;
  transaction_date: Date;
}
