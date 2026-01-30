import { Prisma } from "@prisma/client";
import { CategoryResponseDTO } from "../categories/category-response-dto";

export interface GetIncomesResponseDTO {
  amount: Prisma.Decimal | number;
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
