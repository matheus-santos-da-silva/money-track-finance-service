import { DeleteIncomeProtocol } from "src/domain/use-cases-protocol/incomes";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class DeleteIncomeUseCase implements DeleteIncomeProtocol {
  constructor(private readonly repository: IncomesRepositoryProtocol) {}

  async delete(id: string): Promise<void> {
    try {
      const income = await this.repository.findById(id);
      if (!income) throw new BadRequestException("Receita não existe!");

      await this.repository.delete(id);
    } catch (error) {
      throw error;
    }
  }
}
