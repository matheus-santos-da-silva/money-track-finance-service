import { Decimal } from "@prisma/client/runtime/library";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateIncomeProtocol } from "src/domain/use-cases-protocol/incomes";
import { CreateIncomeServiceProtocol } from "src/domain/services/incomes/protocols/create-income-service-protocol";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { CreateIncomeResponseDTO } from "src/domain/DTO/incomes/create-income-response-DTO";
import { SetUTCDates } from "src/shared/utils/set-utc-dates";

@Injectable()
export class CreateIncomeUseCase implements CreateIncomeProtocol {
  constructor(
    private readonly service: CreateIncomeServiceProtocol,
    private readonly incomeRepository: IncomesRepositoryProtocol,
    private readonly categoryRepository: CategoriesRepositoryProtocol
  ) {}

  async create(data: CreateTransactionDTO): Promise<CreateIncomeResponseDTO> {
    try {
      const category = await this.categoryRepository.find(data.category_id);
      if (!category) {
        throw new BadRequestException("Categoria não existe, tente novamente!");
      }

      const correctTransactionDate = data.transaction_date
        ? data.transaction_date
        : SetUTCDates(new Date());
      const correctCreatedAt = SetUTCDates(new Date());

      const income = await this.service.create({
        ...data,
        amount: new Decimal(data.amount),
        created_at: correctCreatedAt,
        transaction_date: correctTransactionDate,
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
