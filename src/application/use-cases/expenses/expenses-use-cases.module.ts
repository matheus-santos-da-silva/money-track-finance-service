import { Module } from "@nestjs/common";
import { CreateExpenseUseCase } from "./create-expense-use-case";
import { CreateExpenseProtocol } from "src/domain/use-cases-protocol/expenses";
import { ExpensesServicesModule } from "src/domain/services/expenses/expenses-services.module";
import { UsersRepositoriesModule } from "src/infra/database/repositories/users/users-repositories.module";
import { ExpensesRepositoriesModule } from "src/infra/database/repositories/expenses/expenses-repositories.module";
import { CategoriesRepositoriesModule } from "src/infra/database/repositories/categories/categories-repositories.module";

@Module({
  imports: [
    ExpensesRepositoriesModule,
    ExpensesServicesModule,
    CategoriesRepositoriesModule,
    UsersRepositoriesModule,
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
