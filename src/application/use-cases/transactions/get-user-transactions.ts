import { Injectable } from "@nestjs/common";
import { Decimal } from "@prisma/client/runtime/library";
import { GetUserTransactionsInputDTO } from "src/domain/DTO/transactions/get-transactions-input-DTO";
import { GetUserTransactionsResponseDTO } from "src/domain/DTO/transactions/get-user-transactions-response-DTO";
import { GetUserTransactionsProtocol } from "src/domain/use-cases-protocol/transactions/get-user-transactions";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";

@Injectable()
export class GetUserTransactionsUseCase implements GetUserTransactionsProtocol {
  constructor(
    private readonly incomesRepository: IncomesRepositoryProtocol,
    private readonly expensesRepository: ExpensesRepositoryProtocol
  ) {}

  async find({
    user_id,
    start_date,
    end_date,
  }: GetUserTransactionsInputDTO): Promise<GetUserTransactionsResponseDTO> {
    try {
      if (start_date && end_date) {
        end_date.setDate(end_date.getDate() + 1);
        end_date.setHours(20, 59, 59);
      }
      const incomes = await this.incomesRepository.find({
        user_id,
        start_date,
        end_date,
      });

      const expenses = await this.expensesRepository.find({
        user_id,
        start_date,
        end_date,
      });

      const correctIncomes = incomes.map((income) => ({
        ...income,
        amount: new Decimal(income.amount).toNumber(),
      }));

      const correctExpenses = expenses.map((expense) => ({
        ...expense,
        amount: new Decimal(expense.amount).toNumber(),
      }));

      return { incomes: correctIncomes, expenses: correctExpenses };
    } catch (error) {
      throw error;
    }
  }
}
