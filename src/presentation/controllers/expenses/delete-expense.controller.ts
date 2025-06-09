import { AuthGuard } from "src/application/auth/auth.guard";
import { DeleteExpenseProtocol } from "src/domain/use-cases-protocol/expenses";
import { Controller, UseGuards, Delete, Param } from "@nestjs/common";

@Controller("expenses")
@UseGuards(AuthGuard)
export class DeleteExpenseController {
  constructor(private readonly deleteExpenseUseCase: DeleteExpenseProtocol) {}

  @Delete(":id")
  async execute(@Param("id") id: string) {
    try {
      await this.deleteExpenseUseCase.delete(id);
    } catch (error) {
      throw error;
    }
  }
}
