import { Decimal } from "@prisma/client/runtime/library";
import { SetUTCDates } from "src/shared/utils/set-utc-dates";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateIncomeProtocol } from "src/domain/use-cases-protocol/incomes";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { CreateIncomeResponseDTO } from "src/domain/DTO/incomes/create-income-response-DTO";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { CreateIncomeServiceProtocol } from "src/domain/services/incomes/protocols/create-income-service-protocol";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class CreateIncomeUseCase implements CreateIncomeProtocol {
  constructor(
    private readonly service: CreateIncomeServiceProtocol,
    private readonly incomeRepository: IncomesRepositoryProtocol,
    private readonly categoryRepository: CategoriesRepositoryProtocol,
    private readonly usersRepository: UsersRepositoryProtocol
  ) {}

  async create(data: CreateTransactionDTO): Promise<CreateIncomeResponseDTO> {
    try {
      if (new Decimal(data.amount).equals(0)) {
        throw new BadRequestException(
          "Não é possível cadastrar uma receita com o valor R$ 00,00."
        );
      }

      const user = await this.usersRepository.find(data.user_id);
      if (!user) {
        throw new BadRequestException(
          "Não foi possível cadastrar a Receita. Usuário não existe!"
        );
      }

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
      return {
        ...createdIncome,
        amount: new Decimal(createdIncome.amount).toNumber(),
      };
    } catch (error) {
      throw error;
    }
  }
}
