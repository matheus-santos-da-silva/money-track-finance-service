import { DeleteIncomeDTO } from "src/domain/DTO/incomes/delete-income-DTO";
import { DeleteIncomeProtocol } from "src/domain/use-cases-protocol/incomes";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class DeleteIncomeUseCase implements DeleteIncomeProtocol {
  constructor(private readonly repository: IncomesRepositoryProtocol) {}

  async delete({ id, user_id }: DeleteIncomeDTO): Promise<void> {
    try {
      const income = await this.repository.findById(id);
      if (!income) throw new BadRequestException("Receita não existe!");
      if (income.user_id !== user_id) {
        throw new UnauthorizedException(
          "Esta receita possui outro dono, tente novamente com outra!"
        );
      }

      await this.repository.delete(id);
    } catch (error) {
      throw error;
    }
  }
}
