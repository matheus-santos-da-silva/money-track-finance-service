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
import { CreateFinancialEntryDTO } from "src/domain/DTO/create-financial-entry-DTO";
import { TokenPayload } from "src/domain/DTO/token-payload-DTO";
import { CreateExpenseProtocol } from "src/domain/use-cases-protocol/expenses/";

@Controller("expenses")
@UseGuards(AuthGuard)
export class CreateExpenseController {
  constructor(private readonly createExpenseUseCase: CreateExpenseProtocol) {}

  @Post()
  async execute(
    @Body() data: CreateFinancialEntryDTO,
    @Headers("authorization") authHeader: string
  ) {
    let validToken: TokenPayload;
    const token = authHeader.split(" ")[1];
    try {
      validToken = verify(token, process.env.JWT_SECRET) as TokenPayload;
      if (validToken.id !== data.user_id) {
        throw new UnauthorizedException("Não autorizado!");
      }
      const expense = await this.createExpenseUseCase.create(data);
      return expense;
    } catch (error) {
      throw error;
    }
  }
}
