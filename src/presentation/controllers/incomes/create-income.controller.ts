import { Request } from "express";
import { AuthGuard } from "src/application/auth/auth.guard";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateIncomeProtocol } from "src/domain/use-cases-protocol/incomes";
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";

@Controller("incomes")
@UseGuards(AuthGuard)
export class CreateIncomeController {
  constructor(private readonly createIncomeUseCase: CreateIncomeProtocol) {}

  @Post()
  async execute(@Req() req: Request, @Body() data: CreateTransactionDTO) {
    try {
      const user = req["user"] as { id: string };

      const income = await this.createIncomeUseCase.create({
        ...data,
        user_id: user.id,
      });
      return income;
    } catch (error) {
      throw error;
    }
  }
}
