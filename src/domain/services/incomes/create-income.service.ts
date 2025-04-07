import { Injectable } from "@nestjs/common";
import { CreateFinancialEntryDTO } from "src/domain/DTO/create-financial-entry-DTO";
import { Income } from "src/domain/entities/incomes/income";

@Injectable()
export class CreateIncomeService {
  async create({
    user_id,
    amount,
    total_installments,
    category_id,
    description,
    recurrence,
    transaction_date,
  }: CreateFinancialEntryDTO): Promise<Income> {
    const income = new Income({
      user_id,
      amount,
      category_id,
      total_installments,
      description,
      recurrence,
      transaction_date,
    });

    return income;
  }
}
