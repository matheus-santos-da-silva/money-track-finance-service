import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ExpensesUseCasesModule } from "src/application/use-cases/expenses/expenses-use-cases.module";
import {
  CreateExpenseController,
  GetExpenseByIdController,
  DeleteExpenseController,
} from "./";

@Module({
  imports: [ExpensesUseCasesModule],
  controllers: [
    CreateExpenseController,
    GetExpenseByIdController,
    DeleteExpenseController,
  ],
  providers: [
    {
      provide: JwtService,
      useClass: JwtService,
    },
  ],
})
export class ExpensesControllersModule {}
