import { DeleteExpenseProtocol } from "src/domain/use-cases-protocol/expenses";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class DeleteExpenseUseCase implements DeleteExpenseProtocol {
  constructor(private readonly repository: ExpensesRepositoryProtocol) {}

  async delete(id: string): Promise<void> {
    try {
      const expense = await this.repository.findById(id);
      if (!expense) throw new BadRequestException("Despesa não existe!");

      await this.repository.delete(id);
    } catch (error) {
      throw error;
    }
  }
}
