import { Request } from "express";
import { AuthGuard } from "src/application/auth/auth.guard";
import { DeleteExpenseProtocol } from "src/domain/use-cases-protocol/expenses";
import {
  Controller,
  UseGuards,
  Delete,
  Param,
  Req,
  Query,
} from "@nestjs/common";

@Controller("expenses")
@UseGuards(AuthGuard)
export class DeleteExpenseController {
  constructor(private readonly deleteExpenseUseCase: DeleteExpenseProtocol) {}

  @Delete(":id")
  async execute(
    @Req() req: Request,
    @Param("id") id: string,
    @Query("applyToAll") applyToAll: string
  ) {
    try {
      const user = req["user"] as { id: string };
      await this.deleteExpenseUseCase.delete({
        id,
        user_id: user.id,
        applyToAll: applyToAll === "true",
      });
    } catch (error) {
      throw error;
    }
  }
}
