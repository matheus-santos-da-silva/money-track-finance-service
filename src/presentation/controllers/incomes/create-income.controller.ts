import { AuthGuard } from "src/application/auth/auth.guard";
import { validateToken } from "src/shared/utils/validate-token";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateIncomeProtocol } from "src/domain/use-cases-protocol/incomes";
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";

@Controller("incomes")
@UseGuards(AuthGuard)
export class CreateIncomeController {
  constructor(private readonly createIncomeUseCase: CreateIncomeProtocol) {}

  @Post()
  async execute(
    @Body() data: CreateTransactionDTO,
    @Headers("authorization") authHeader: string
  ) {
    try {
      const validToken = validateToken(authHeader, data.user_id);
      if (!validToken) throw new UnauthorizedException("Não autorizado!");

      const income = await this.createIncomeUseCase.create(data);
      return income;
    } catch (error) {
      throw error;
    }
  }
}
