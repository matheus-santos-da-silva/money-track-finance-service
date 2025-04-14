import {
  Body,
  Controller,
  Post,
  UseGuards,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";
import { verify } from "jsonwebtoken";
import { AuthGuard } from "src/application/auth/auth.guard";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { TokenPayload } from "src/domain/DTO/token-payload-DTO";
import { CreateIncomeProtocol } from "src/domain/use-cases-protocol/incomes";

@Controller("incomes")
@UseGuards(AuthGuard)
export class CreateIncomeController {
  constructor(private readonly createIncomeUseCase: CreateIncomeProtocol) {}

  @Post()
  async execute(
    @Body() data: CreateTransactionDTO,
    @Headers("authorization") authHeader: string
  ) {
    let validToken: TokenPayload;
    const token = authHeader.split(" ")[1];
    try {
      validToken = verify(token, process.env.JWT_SECRET) as TokenPayload;
      if (validToken.id !== data.user_id) {
        throw new UnauthorizedException("Não autorizado!");
      }
      const income = await this.createIncomeUseCase.create(data);
      return income;
    } catch (error) {
      throw error;
    }
  }
}
