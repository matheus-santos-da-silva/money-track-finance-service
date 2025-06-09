import { Module } from "@nestjs/common";
import { ExpensesServicesModule } from "src/domain/services/expenses/expenses-services.module";
import { UsersRepositoriesModule } from "src/infra/database/repositories/users/users-repositories.module";
import { ExpensesRepositoriesModule } from "src/infra/database/repositories/expenses/expenses-repositories.module";
import { CategoriesRepositoriesModule } from "src/infra/database/repositories/categories/categories-repositories.module";
import {
  CreateExpenseUseCase,
  DeleteExpenseUseCase,
  GetExpenseByIdUseCase,
} from "./";
import {
  CreateExpenseProtocol,
  DeleteExpenseProtocol,
  GetExpenseByIdProtocol,
} from "src/domain/use-cases-protocol/expenses";

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
    {
      provide: GetExpenseByIdProtocol,
      useClass: GetExpenseByIdUseCase,
    },
    {
      provide: DeleteExpenseProtocol,
      useClass: DeleteExpenseUseCase,
    },
  ],
  exports: [
    CreateExpenseProtocol,
    GetExpenseByIdProtocol,
    DeleteExpenseProtocol,
  ],
})
export class ExpensesUseCasesModule {}
