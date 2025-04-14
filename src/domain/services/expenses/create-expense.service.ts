import { Injectable } from "@nestjs/common";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { Expense } from "src/domain/entities/expenses/expense";

@Injectable()
export class CreateExpenseService {
  async create({
    user_id,
    amount,
    total_installments,
    category_id,
    description,
    recurrence,
    transaction_date,
    created_at,
  }: CreateTransactionDTO): Promise<Expense> {
    const expense = new Expense({
      user_id,
      amount,
      category_id,
      total_installments,
      description,
      recurrence,
      transaction_date,
      created_at,
    });

    return expense;
  }
}
