import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { IncomesUseCasesModule } from "src/application/use-cases/incomes/incomes-use-cases.module";
import { CreateIncomeController } from "./create-income.controller";

@Module({
  imports: [IncomesUseCasesModule],
  controllers: [CreateIncomeController],
  providers: [
    {
      provide: JwtService,
      useClass: JwtService,
    },
  ],
})
export class IncomesControllersModule {}
