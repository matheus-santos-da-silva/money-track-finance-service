import { Module } from "@nestjs/common";
import { ExpensesControllersModule } from "./presentation/controllers/expenses/expenses-controllers.module";
import { AuthModule } from "./application/auth/auth.module";
import { IncomesControllersModule } from "./presentation/controllers/incomes/incomes-controllers.module";
import { TransactionsControllersModule } from "./presentation/controllers/transactions/transactions-controllers.module";

@Module({
  imports: [
    ExpensesControllersModule,
    IncomesControllersModule,
    TransactionsControllersModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
