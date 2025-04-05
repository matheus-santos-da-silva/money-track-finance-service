import { Module } from "@nestjs/common";
import { CreateExpenseProtocol } from "src/domain/use-cases-protocol/expenses";
import { CreateExpenseUseCase } from "./create-expense-use-case";
import { ExpensesRepositoriesModule } from "src/infra/database/repositories/expenses/expenses-repositories.module";
import { ExpensesServicesModule } from "src/domain/services/expenses/expenses-services.module";
import { CategoriesRepositoriesModule } from "src/infra/database/repositories/categories/categories-repositories.module";

@Module({
  imports: [
    ExpensesRepositoriesModule,
    ExpensesServicesModule,
    CategoriesRepositoriesModule,
  ],
  providers: [
    {
      provide: CreateExpenseProtocol,
      useClass: CreateExpenseUseCase,
    },
  ],
  exports: [CreateExpenseProtocol],
})
export class ExpensesUseCasesModule {}
