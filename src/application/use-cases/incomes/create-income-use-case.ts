import { Decimal } from "@prisma/client/runtime/library";
import { CreateFinancialEntryDTO } from "src/domain/DTO/create-financial-entry-DTO";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateIncomeProtocol } from "src/domain/use-cases-protocol/incomes";
import { CreateIncomeServiceProtocol } from "src/domain/services/incomes/protocols/create-income-service-protocol";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { CreateIncomeResponseDTO } from "src/domain/DTO/incomes/create-income-response-DTO";

@Injectable()
export class CreateIncomeUseCase implements CreateIncomeProtocol {
  constructor(
    private readonly service: CreateIncomeServiceProtocol,
    private readonly incomeRepository: IncomesRepositoryProtocol,
    private readonly categoryRepository: CategoriesRepositoryProtocol
  ) {}

  async create(
    data: CreateFinancialEntryDTO
  ): Promise<CreateIncomeResponseDTO> {
    try {
      const category = await this.categoryRepository.find(data.category_id);
      if (!category) {
        throw new BadRequestException("Categoria não existe, tente novamente!");
      }

      const income = await this.service.create({
        ...data,
        amount: new Decimal(data.amount),
        category_id: category.id,
      });

      const createdIncome = await this.incomeRepository.create(income);
      if (!createdIncome) {
        throw new BadRequestException(
          "Erro na criação da receita, tente novamente!"
        );
      }
      return createdIncome;
    } catch (error) {
      throw error;
    }
  }
}
