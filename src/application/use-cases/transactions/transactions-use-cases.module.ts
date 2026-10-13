import { Module } from "@nestjs/common";
import { RecurringSeriesRepositoriesModule } from "src/infra/database/repositories/recurring-series/recurring-series-repositories.module";
import { MaterializeRecurrencesService } from "src/application/services/materialize-recurrences.service";
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
    RecurringSeriesRepositoriesModule,
  ],
  providers: [
    MaterializeRecurrencesService,
    {
      provide: GetUserTransactionsProtocol,
      useClass: GetUserTransactionsUseCase,
    },
  ],
  exports: [GetUserTransactionsProtocol],
})
export class TransactionsUseCasesModule {}
