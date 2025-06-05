import { Module } from "@nestjs/common";
import { UsersRepositoriesModule } from "src/infra/database/repositories/users/users-repositories.module";
import { IncomesRepositoriesModule } from "src/infra/database/repositories/incomes/incomes-repositories.module";
import { ExpensesRepositoriesModule } from "src/infra/database/repositories/expenses/expenses-repositories.module";
import { GetUserTransactionsUseCase } from "./get-user-transactions";
import { GetUserTransactionsProtocol } from "src/domain/use-cases-protocol/transactions/get-user-transactions";

@Module({
  imports: [
    ExpensesRepositoriesModule,
    IncomesRepositoriesModule,
    UsersRepositoriesModule,
  ],
  providers: [
    {
      provide: GetUserTransactionsProtocol,
      useClass: GetUserTransactionsUseCase,
    },
  ],
  exports: [GetUserTransactionsProtocol],
})
export class TransactionsUseCasesModule {}
