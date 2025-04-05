import { Module } from "@nestjs/common";
import { ExpensesControllersModule } from "./presentation/controllers/expenses/expenses-controllers.module";
import { AuthModule } from "./application/auth/auth.module";

@Module({
  imports: [ExpensesControllersModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
