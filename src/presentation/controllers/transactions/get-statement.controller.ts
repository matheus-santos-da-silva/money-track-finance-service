import { Request } from "express";
import { AuthGuard } from "src/application/auth/auth.guard";
import { GetStatementProtocol } from "src/domain/use-cases-protocol/transactions/get-statement";
import { GetStatementQueryDTO } from "src/domain/DTO/transactions/get-statement-query-DTO";
import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";

@Controller("transactions")
export class GetStatementController {
  constructor(private readonly getStatementUseCase: GetStatementProtocol) {}

  @Get("statement")
  @UseGuards(AuthGuard)
  async execute(@Req() req: Request, @Query() query: GetStatementQueryDTO) {
    const user = req["user"] as { id: string };

    return this.getStatementUseCase.find(user.id, query);
  }
}
