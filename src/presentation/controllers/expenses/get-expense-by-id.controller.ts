import { AuthGuard } from "src/application/auth/auth.guard";
import { GetExpenseByIdProtocol } from "src/domain/use-cases-protocol/expenses/get-expense-by-id";
import { Request } from "express";
import { Controller, UseGuards, Param, Get, Req } from "@nestjs/common";

@Controller("expenses")
@UseGuards(AuthGuard)
export class GetExpenseByIdController {
  constructor(private readonly getExpenseUseCase: GetExpenseByIdProtocol) {}

  @Get(":id")
  async execute(@Req() req: Request, @Param("id") id: string) {
    try {
      const user = req["user"] as { id: string };
      const expense = await this.getExpenseUseCase.findById(id, user.id);
      return expense;
    } catch (error) {
      throw error;
    }
  }
}
