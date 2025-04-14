import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { GetUserTransactionsController } from "./get-user-transactions.controller";
import { TransactionsUseCasesModule } from "src/application/use-cases/transactions/transactions-use-cases.module";

@Module({
  imports: [TransactionsUseCasesModule],
  controllers: [GetUserTransactionsController],
  providers: [
    {
      provide: JwtService,
      useClass: JwtService,
    },
  ],
})
export class TransactionsControllersModule {}
