import { Decimal } from "@prisma/client/runtime/library";
import { BadRequestException, Injectable } from "@nestjs/common";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { GetUserTransactionsInputDTO } from "src/domain/DTO/transactions/get-transactions-input-DTO";
import { GetUserTransactionsProtocol } from "src/domain/use-cases-protocol/transactions/get-user-transactions";
import { GetUserTransactionsResponseDTO } from "src/domain/DTO/transactions/get-user-transactions-response-DTO";

@Injectable()
export class GetUserTransactionsUseCase implements GetUserTransactionsProtocol {
  constructor(
    private readonly incomesRepository: IncomesRepositoryProtocol,
    private readonly expensesRepository: ExpensesRepositoryProtocol,
    private readonly usersRepository: UsersRepositoryProtocol
  ) {}

  async find({
    user_id,
    start_date,
    end_date,
  }: GetUserTransactionsInputDTO): Promise<GetUserTransactionsResponseDTO> {
    try {
      const user = await this.usersRepository.find(user_id);
      if (!user) throw new BadRequestException("Usuário não existe!");

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
