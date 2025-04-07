import { Module } from "@nestjs/common";
import { CreateIncomeServiceProtocol } from "./protocols/create-income-service-protocol";
import { CreateIncomeService } from "./create-income.service";

@Module({
  imports: [],
  providers: [
    {
      provide: CreateIncomeServiceProtocol,
      useClass: CreateIncomeService,
    },
  ],
  exports: [CreateIncomeServiceProtocol],
})
export class IncomesServicesModule {}
