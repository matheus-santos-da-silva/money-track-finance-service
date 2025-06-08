import { AuthGuard } from "src/application/auth/auth.guard";
import { GetExpenseByIdProtocol } from "src/domain/use-cases-protocol/expenses/get-expense-by-id";
import { Controller, UseGuards, Param, Get } from "@nestjs/common";

@Controller("expenses")
@UseGuards(AuthGuard)
export class GetExpenseByIdController {
  constructor(private readonly getExpenseUseCase: GetExpenseByIdProtocol) {}

  @Get(":id")
  async execute(@Param("id") id: string) {
    try {
      const expense = await this.getExpenseUseCase.findById(id);
      return expense;
    } catch (error) {
      throw error;
    }
  }
}
