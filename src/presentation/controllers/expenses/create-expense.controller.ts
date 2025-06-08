import { AuthGuard } from "src/application/auth/auth.guard";
import { validateToken } from "src/shared/utils/validate-token";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateExpenseProtocol } from "src/domain/use-cases-protocol/expenses/";
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";

@Controller("expenses")
@UseGuards(AuthGuard)
export class CreateExpenseController {
  constructor(private readonly createExpenseUseCase: CreateExpenseProtocol) {}

  @Post()
  async execute(
    @Body() data: CreateTransactionDTO,
    @Headers("authorization") authHeader: string
  ) {
    try {
      const validToken = validateToken(authHeader, data.user_id);
      if (!validToken) throw new UnauthorizedException("Não autorizado!");

      const expense = await this.createExpenseUseCase.create(data);
      return expense;
    } catch (error) {
      throw error;
    }
  }
}
