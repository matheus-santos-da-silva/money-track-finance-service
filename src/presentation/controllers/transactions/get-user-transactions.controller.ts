import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from "@nestjs/common";
import { GetUserTransactionsProtocol } from "src/domain/use-cases-protocol/transactions/get-user-transactions";
import { ParseDatePipe } from "src/presentation/custom-pipes/parse-date-pipe";

@Controller("transactions")
export class GetUserTransactionsController {
  constructor(
    private readonly getUserTransactionsUseCase: GetUserTransactionsProtocol
  ) {}

  @Get(":userId")
  async execute(
    @Param("userId") user_id: string,
    @Query("start_date", ParseDatePipe) start_date?: Date,
    @Query("end_date", ParseDatePipe) end_date?: Date
  ) {
    try {
      if ((!start_date && end_date) || (start_date && !end_date)) {
        throw new BadRequestException(
          "Para filtrar por datas, é necessário as conter as duas - start_date e end_date"
        );
      }
      const transactions = await this.getUserTransactionsUseCase.find({
        user_id,
        start_date,
        end_date,
      });
      return transactions;
    } catch (error) {
      throw error;
    }
  }
}
