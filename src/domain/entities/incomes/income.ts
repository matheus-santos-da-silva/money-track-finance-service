import { Recurrence } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

interface IncomeProps {
  user_id: string;
  amount: Decimal;
  description?: string;
  recurrence: Recurrence;
  category_id: string;
  total_installments: number;
  transaction_date?: Date;
  created_at: Date;
}

export class Income {
  id: string;
  user_id: string;
  amount: Decimal;
  description?: string;
  category_id: string;
  recurrence?: Recurrence;
  total_installments: number;
  transaction_date: Date;
  created_at: Date;

  constructor({
    user_id,
    amount,
    recurrence,
    description,
    category_id,
    total_installments,
    transaction_date,
    created_at,
  }: IncomeProps) {
    this.user_id = user_id;
    this.amount = amount;
    this.recurrence = recurrence;
    this.description = description;
    this.category_id = category_id;
    this.total_installments = total_installments;
    this.transaction_date = transaction_date;
    this.created_at = created_at;
  }
}
