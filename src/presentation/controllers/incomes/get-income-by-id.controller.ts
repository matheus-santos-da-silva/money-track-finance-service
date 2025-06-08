import { AuthGuard } from "src/application/auth/auth.guard";
import { GetIncomeByIdProtocol } from "src/domain/use-cases-protocol/incomes/get-income-by-id";
import { Controller, UseGuards, Param, Get } from "@nestjs/common";

@Controller("incomes")
@UseGuards(AuthGuard)
export class GetIncomeByIdController {
  constructor(private readonly getIncomeUseCase: GetIncomeByIdProtocol) {}

  @Get(":id")
  async execute(@Param("id") id: string) {
    try {
      const income = await this.getIncomeUseCase.findById(id);
      return income;
    } catch (error) {
      throw error;
    }
  }
}