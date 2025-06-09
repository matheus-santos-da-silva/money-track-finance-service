import { Module } from "@nestjs/common";
import { IncomesServicesModule } from "src/domain/services/incomes/incomes-services.module";
import { UsersRepositoriesModule } from "src/infra/database/repositories/users/users-repositories.module";
import { IncomesRepositoriesModule } from "src/infra/database/repositories/incomes/incomes-repositories.module";
import { CategoriesRepositoriesModule } from "src/infra/database/repositories/categories/categories-repositories.module";
import {
  CreateIncomeUseCase,
  DeleteIncomeUseCase,
  GetIncomeByIdUseCase,
} from "./";
import {
  CreateIncomeProtocol,
  DeleteIncomeProtocol,
  GetIncomeByIdProtocol,
} from "src/domain/use-cases-protocol/incomes";

@Module({
  imports: [
    IncomesRepositoriesModule,
    IncomesServicesModule,
    CategoriesRepositoriesModule,
    UsersRepositoriesModule,
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
  ],
  exports: [CreateIncomeProtocol, GetIncomeByIdProtocol, DeleteIncomeProtocol],
})
export class IncomesUseCasesModule {}
