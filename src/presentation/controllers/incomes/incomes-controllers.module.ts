import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { IncomesUseCasesModule } from "src/application/use-cases/incomes/incomes-use-cases.module";
import { CreateIncomeController, GetIncomeByIdController } from "./";

@Module({
  imports: [IncomesUseCasesModule],
  controllers: [CreateIncomeController, GetIncomeByIdController],
  providers: [
    {
      provide: JwtService,
      useClass: JwtService,
    },
  ],
})
export class IncomesControllersModule {}
