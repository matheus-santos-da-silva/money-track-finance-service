import { Module } from "@nestjs/common";
import { AuthModule } from "./application/auth/auth.module";
import { ConsumersModule } from "./infra/kafka/consumers/consumers.module";
import { IncomesControllersModule } from "./presentation/controllers/incomes/incomes-controllers.module";
import { ExpensesControllersModule } from "./presentation/controllers/expenses/expenses-controllers.module";
import { TransactionsControllersModule } from "./presentation/controllers/transactions/transactions-controllers.module";

@Module({
  imports: [
    ExpensesControllersModule,
    IncomesControllersModule,
    TransactionsControllersModule,
    ConsumersModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
