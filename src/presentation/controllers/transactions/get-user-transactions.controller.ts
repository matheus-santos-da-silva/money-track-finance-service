import { Request } from "express";
import { AuthGuard } from "src/application/auth/auth.guard";
import { ParseDatePipe } from "src/presentation/custom-pipes/parse-date-pipe";
import { GetUserTransactionsProtocol } from "src/domain/use-cases-protocol/transactions/get-user-transactions";
import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";

@Controller("transactions")
export class GetUserTransactionsController {
  constructor(
    private readonly getUserTransactionsUseCase: GetUserTransactionsProtocol
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  async execute(
    @Req() req: Request,
    @Query("start_date", ParseDatePipe) start_date?: Date,
    @Query("end_date", ParseDatePipe) end_date?: Date
  ) {
    try {
      const user = req["user"] as { id: string };

      if ((!start_date && end_date) || (start_date && !end_date)) {
        throw new BadRequestException(
          "Para filtrar por datas, é necessário as conter as duas - start_date e end_date"
        );
      }
      const transactions = await this.getUserTransactionsUseCase.find({
        user_id: user.id,
        start_date,
        end_date,
      });
      return transactions;
    } catch (error) {
      throw error;
    }
  }
}
