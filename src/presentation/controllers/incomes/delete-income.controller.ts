import { AuthGuard } from "src/application/auth/auth.guard";
import { DeleteIncomeProtocol } from "src/domain/use-cases-protocol/incomes";
import { Controller, UseGuards, Delete, Param, Req } from "@nestjs/common";
import { Request } from "express";

@Controller("incomes")
@UseGuards(AuthGuard)
export class DeleteIncomeController {
  constructor(private readonly deleteIncomeUseCase: DeleteIncomeProtocol) {}

  @Delete(":id")
  async execute(@Req() req: Request, @Param("id") id: string) {
    try {
      const user = req["user"] as { id: string };
      await this.deleteIncomeUseCase.delete({ id, user_id: user.id });
    } catch (error) {
      throw error;
    }
  }
}
