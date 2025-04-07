import { Module } from "@nestjs/common";
import { CategoriesRepositoriesModule } from "src/infra/database/repositories/categories/categories-repositories.module";
import { CreateIncomeUseCase } from "./create-income-use-case";
import { CreateIncomeProtocol } from "src/domain/use-cases-protocol/incomes";
import { IncomesServicesModule } from "src/domain/services/incomes/incomes-services.module";
import { IncomesRepositoriesModule } from "src/infra/database/repositories/incomes/incomes-repositories.module";

@Module({
  imports: [
    IncomesRepositoriesModule,
    IncomesServicesModule,
    CategoriesRepositoriesModule,
  ],
  providers: [
    {
      provide: CreateIncomeProtocol,
      useClass: CreateIncomeUseCase,
    },
  ],
  exports: [CreateIncomeProtocol],
})
export class IncomesUseCasesModule {}
