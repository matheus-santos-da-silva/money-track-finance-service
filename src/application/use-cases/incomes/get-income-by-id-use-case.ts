import { Decimal } from "@prisma/client/runtime/library";
import { GetIncomeByIdProtocol } from "src/domain/use-cases-protocol/incomes/get-income-by-id";
import { GetIncomesResponseDTO } from "src/domain/DTO/incomes/get-incomes-response-DTO";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class GetIncomeByIdUseCase implements GetIncomeByIdProtocol {
  constructor(private readonly repository: IncomesRepositoryProtocol) {}

  async findById(id: string): Promise<GetIncomesResponseDTO> {
    try {
      const income = await this.repository.findById(id);
      if (!income) {
        throw new BadRequestException("Receita não existe, tente novamente!");
      }

      return { ...income, amount: new Decimal(income.amount).toNumber() };
    } catch (error) {
      throw error;
    }
  }
}
