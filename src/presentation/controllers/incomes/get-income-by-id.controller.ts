import { AuthGuard } from "src/application/auth/auth.guard";
import { GetIncomeByIdProtocol } from "src/domain/use-cases-protocol/incomes/get-income-by-id";
import { Request } from "express";
import { Controller, UseGuards, Param, Get, Req } from "@nestjs/common";

@Controller("incomes")
@UseGuards(AuthGuard)
export class GetIncomeByIdController {
  constructor(private readonly getIncomeUseCase: GetIncomeByIdProtocol) {}

  @Get(":id")
  async execute(@Req() req: Request, @Param("id") id: string) {
    try {
      const user = req["user"] as { id: string };
      const income = await this.getIncomeUseCase.findById(id, user.id);
      return income;
    } catch (error) {
      throw error;
    }
  }
}