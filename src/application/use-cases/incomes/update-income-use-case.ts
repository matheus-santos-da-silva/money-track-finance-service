import { UpdateIncomeDTO } from "src/domain/DTO/incomes/update-income-DTO";
import { UpdateIncomeProtocol } from "src/domain/use-cases-protocol/incomes/update-income";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class UpdateIncomeUseCase implements UpdateIncomeProtocol {
  constructor(private readonly repository: IncomesRepositoryProtocol) {}

  async update({ id, user_id, data }: UpdateIncomeDTO): Promise<void> {
    try {
      const income = await this.repository.findById(id);

      if (!income) throw new BadRequestException("Receita não existe!");
      if (income.user_id !== user_id) {
        throw new UnauthorizedException(
          "Esta receita possui outro dono, tente novamente com outra!"
        );
      }

      await this.repository.update(id, data);
    } catch (error) {
      throw error;
    }
  }
}
