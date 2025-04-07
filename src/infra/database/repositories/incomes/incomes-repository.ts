import { BadRequestException, Injectable } from "@nestjs/common";
import { IncomesRepositoryProtocol } from "./protocols/incomes-repository-protocol";
import { PrismaService } from "../../config/prisma.service";
import { CreateFinancialEntryDTO } from "src/domain/DTO/create-financial-entry-DTO";
import { CreateIncomeResponseDTO } from "src/domain/DTO/incomes/create-income-response-DTO";

@Injectable()
export class IncomesRepository implements IncomesRepositoryProtocol {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateFinancialEntryDTO
  ): Promise<CreateIncomeResponseDTO> {
    try {
      const income = await this.prisma.income.create({
        data,
        select: {
          amount: true,
          category_id: true,
          description: true,
          id: true,
          total_installments: true,
        },
      });

      return income;
    } catch (error) {
      throw new BadRequestException(
        "Erro ao criar a receita, tente novamente!"
      );
    }
  }
}
