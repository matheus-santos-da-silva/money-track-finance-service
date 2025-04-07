import { Module } from "@nestjs/common";
import { ExpensesControllersModule } from "./presentation/controllers/expenses/expenses-controllers.module";
import { AuthModule } from "./application/auth/auth.module";
import { IncomesControllersModule } from "./presentation/controllers/incomes/incomes-controllers.module";

@Module({
  imports: [ExpensesControllersModule, IncomesControllersModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
