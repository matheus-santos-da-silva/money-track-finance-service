import { Request } from "express";
import { AuthGuard } from "src/application/auth/auth.guard";
import { DeleteExpenseProtocol } from "src/domain/use-cases-protocol/expenses";
import { Controller, UseGuards, Delete, Param, Req } from "@nestjs/common";
@Controller("expenses")
@UseGuards(AuthGuard)
export class DeleteExpenseController {
  constructor(private readonly deleteExpenseUseCase: DeleteExpenseProtocol) {}

  @Delete(":id")
  async execute(@Req() req: Request, @Param("id") id: string) {
    try {
      const user = req["user"] as { id: string };
      await this.deleteExpenseUseCase.delete({ id, user_id: user.id });
    } catch (error) {
      throw error;
    }
  }
}
