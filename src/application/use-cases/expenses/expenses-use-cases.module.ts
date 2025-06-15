import { Module } from "@nestjs/common";
import { ExpensesServicesModule } from "src/domain/services/expenses/expenses-services.module";
import { UsersRepositoriesModule } from "src/infra/database/repositories/users/users-repositories.module";
import { ExpensesRepositoriesModule } from "src/infra/database/repositories/expenses/expenses-repositories.module";
import { CategoriesRepositoriesModule } from "src/infra/database/repositories/categories/categories-repositories.module";
import {
  CreateExpenseUseCase,
  DeleteExpenseUseCase,
  GetExpenseByIdUseCase,
  UpdateExpenseUseCase,
} from "./";
import {
  CreateExpenseProtocol,
  DeleteExpenseProtocol,
  GetExpenseByIdProtocol,
  UpdateExpenseProtocol,
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
    {
      provide: UpdateExpenseProtocol,
      useClass: UpdateExpenseUseCase,
    },
  ],
  exports: [
    CreateExpenseProtocol,
    GetExpenseByIdProtocol,
    DeleteExpenseProtocol,
    UpdateExpenseProtocol,
  ],
})
export class ExpensesUseCasesModule {}
