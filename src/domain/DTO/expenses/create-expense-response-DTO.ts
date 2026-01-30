import { Prisma } from "@prisma/client";

export interface CreateExpenseResponseDTO {
  amount: Prisma.Decimal | number;
  category_id: string;
  description?: string;
  id: string;
  total_installments: number;
  current_installment: number;
}
