import { AuthGuard } from "src/application/auth/auth.guard";
import { DeleteIncomeProtocol } from "src/domain/use-cases-protocol/incomes";
import { Controller, UseGuards, Delete, Param } from "@nestjs/common";

@Controller("incomes")
@UseGuards(AuthGuard)
export class DeleteIncomeController {
  constructor(private readonly deleteIncomeUseCase: DeleteIncomeProtocol) {}

  @Delete(":id")
  async execute(@Param("id") id: string) {
    try {
      await this.deleteIncomeUseCase.delete(id);
    } catch (error) {
      throw error;
    }
  }
}
