import { Module } from "@nestjs/common";
import { ExpensesRepositoriesModule } from "src/infra/database/repositories/expenses/expenses-repositories.module";
import { GetUserTransactionsProtocol } from "src/domain/use-cases-protocol/transactions/get-user-transactions";
import { GetUserTransactionsUseCase } from "./get-user-transactions";
import { IncomesRepositoriesModule } from "src/infra/database/repositories/incomes/incomes-repositories.module";

@Module({
  imports: [ExpensesRepositoriesModule, IncomesRepositoriesModule],
  providers: [
    {
      provide: GetUserTransactionsProtocol,
      useClass: GetUserTransactionsUseCase,
    },
  ],
  exports: [GetUserTransactionsProtocol],
})
export class TransactionsUseCasesModule {}
