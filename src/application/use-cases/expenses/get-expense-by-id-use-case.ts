import { Decimal } from "@prisma/client/runtime/library";
import { GetExpensesResponseDTO } from "src/domain/DTO/expenses/get-expenses-response-DTO";
import { GetExpenseByIdProtocol } from "src/domain/use-cases-protocol/expenses/get-expense-by-id";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class GetExpenseByIdUseCase implements GetExpenseByIdProtocol {
  constructor(private readonly repository: ExpensesRepositoryProtocol) {}

  async findById(id: string): Promise<GetExpensesResponseDTO> {
    try {
      const expense = await this.repository.findById(id);
      if (!expense) {
        throw new BadRequestException("Despesa não existe, tente novamente!");
      }

      return { ...expense, amount: new Decimal(expense.amount).toNumber() };
    } catch (error) {
      throw error;
    }
  }
}
