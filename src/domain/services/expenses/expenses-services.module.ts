import { Module } from "@nestjs/common";
import { CreateExpenseServiceProtocol } from "./protocols/create-expense-service-protocol";
import { CreateExpenseService } from "./create-expense.service";

@Module({
  imports: [],
  providers: [
    {
      provide: CreateExpenseServiceProtocol,
      useClass: CreateExpenseService,
    },
  ],
  exports: [CreateExpenseServiceProtocol],
})
export class ExpensesServicesModule {}
