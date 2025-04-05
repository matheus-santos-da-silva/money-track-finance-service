import { Module } from "@nestjs/common";
import { CreateExpenseController } from "./create-expense.controller";
import { ExpensesUseCasesModule } from "src/application/use-cases/expenses/expenses-use-cases.module";
import { JwtService } from "@nestjs/jwt";

@Module({
  imports: [ExpensesUseCasesModule],
  controllers: [CreateExpenseController],
  providers: [
    {
      provide: JwtService,
      useClass: JwtService,
    },
  ],
})
export class ExpensesControllersModule {}
