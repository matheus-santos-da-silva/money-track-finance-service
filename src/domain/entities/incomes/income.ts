import { Recurrence } from "@prisma/client";

interface IncomeProps {
  user_id: string;
  amount: number;
  description?: string;
  category_id: string;
  recurrence: Recurrence;
  total_installments: number;
}

export class Income {
  id: string;
  user_id: string;
  amount: number;
  description?: string;
  category_id: string;
  recurrence: Recurrence;
  total_installments: number;
  income_date: Date;
  created_at: Date;

  constructor({
    user_id,
    amount,
    recurrence,
    description,
    category_id,
    total_installments,
  }: IncomeProps) {
    this.user_id = user_id;
    this.amount = amount;
    this.recurrence = recurrence;
    this.description = description;
    this.category_id = category_id;
    this.total_installments = total_installments;
  }
}
