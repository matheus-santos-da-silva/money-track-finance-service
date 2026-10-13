import { Request } from "express";
import { AuthGuard } from "src/application/auth/auth.guard";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateExpenseProtocol } from "src/domain/use-cases-protocol/expenses/";
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";

@Controller("expenses")
@UseGuards(AuthGuard)
export class CreateExpenseController {
  constructor(private readonly createExpenseUseCase: CreateExpenseProtocol) {}

  @Post()
  async execute(@Req() req: Request, @Body() data: CreateTransactionDTO) {
    try {
      const user = req["user"] as { id: string };

      const expense = await this.createExpenseUseCase.create({
        ...data,
        user_id: user.id,
      });
      return expense;
    } catch (error) {
      throw error;
    }
  }
}
