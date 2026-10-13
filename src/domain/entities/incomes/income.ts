import { Recurrence } from "@prisma/client";
import { Prisma } from "@prisma/client";

interface IncomeProps {
  user_id: string;
  amount: Prisma.Decimal;
  description?: string;
  recurrence: Recurrence;
  category_id: string;
  total_installments: number;
  current_installment: number;
  installment_group_id?: string;
  transaction_date?: Date;
  created_at: Date;
}

export class Income {
  id: string;
  user_id: string;
  amount: Prisma.Decimal;
  description?: string;
  category_id: string;
  recurrence?: Recurrence;
  total_installments: number;
  current_installment: number;
  installment_group_id?: string;
  recurrence_series_id?: string | null;
  transaction_date: Date;
  created_at: Date;

  constructor({
    user_id,
    amount,
    recurrence,
    description,
    category_id,
    total_installments,
    current_installment,
    installment_group_id,
    transaction_date,
    created_at,
  }: IncomeProps) {
    this.user_id = user_id;
    this.amount = amount;
    this.recurrence = recurrence;
    this.description = description;
    this.category_id = category_id;
    this.total_installments = total_installments;
    this.current_installment = current_installment;
    this.installment_group_id = installment_group_id;
    this.transaction_date = transaction_date;
    this.created_at = created_at;
  }
}
