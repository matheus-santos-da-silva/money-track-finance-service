import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Headers,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { verify } from "jsonwebtoken";
import { AuthGuard } from "src/application/auth/auth.guard";
import { TokenPayload } from "src/domain/DTO/token-payload-DTO";
import { GetUserTransactionsProtocol } from "src/domain/use-cases-protocol/transactions/get-user-transactions";
import { ParseDatePipe } from "src/presentation/custom-pipes/parse-date-pipe";

@Controller("transactions")
export class GetUserTransactionsController {
  constructor(
    private readonly getUserTransactionsUseCase: GetUserTransactionsProtocol
  ) {}

  @Get(":userId")
  @UseGuards(AuthGuard)
  async execute(
    @Param("userId") user_id: string,
    @Headers("authorization") authHeader: string,
    @Query("start_date", ParseDatePipe) start_date?: Date,
    @Query("end_date", ParseDatePipe) end_date?: Date
  ) {
    let validToken: TokenPayload;
    const token = authHeader.split(" ")[1];
    try {
      validToken = verify(token, process.env.JWT_SECRET) as TokenPayload;
      if (validToken.id !== user_id) {
        throw new UnauthorizedException("Não autorizado!");
      }
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
