import { Module } from "@nestjs/common";
import { RecurringSeriesRepositoriesModule } from "src/infra/database/repositories/recurring-series/recurring-series-repositories.module";
import { UsersRepositoriesModule } from "src/infra/database/repositories/users/users-repositories.module";
import { IncomesRepositoriesModule } from "src/infra/database/repositories/incomes/incomes-repositories.module";
import { CategoriesRepositoriesModule } from "src/infra/database/repositories/categories/categories-repositories.module";
import {
  CreateIncomeUseCase,
  DeleteIncomeUseCase,
  GetIncomeByIdUseCase,
  UpdateIncomeUseCase,
} from "./";
import {
  CreateIncomeProtocol,
  DeleteIncomeProtocol,
  GetIncomeByIdProtocol,
  UpdateIncomeProtocol,
} from "src/domain/use-cases-protocol/incomes";

@Module({
  imports: [
    IncomesRepositoriesModule,
    CategoriesRepositoriesModule,
    UsersRepositoriesModule,
    RecurringSeriesRepositoriesModule,
  ],
  providers: [
    {
      provide: CreateIncomeProtocol,
      useClass: CreateIncomeUseCase,
    },
    {
      provide: GetIncomeByIdProtocol,
      useClass: GetIncomeByIdUseCase,
    },
    {
      provide: DeleteIncomeProtocol,
      useClass: DeleteIncomeUseCase,
    },
    {
      provide: UpdateIncomeProtocol,
      useClass: UpdateIncomeUseCase,
    },
  ],
  exports: [
    CreateIncomeProtocol,
    GetIncomeByIdProtocol,
    DeleteIncomeProtocol,
    UpdateIncomeProtocol,
  ],
})
export class IncomesUseCasesModule {}
