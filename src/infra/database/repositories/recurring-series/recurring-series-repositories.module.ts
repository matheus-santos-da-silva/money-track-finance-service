import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { RecurringSeriesRepository } from "./recurring-series-repository";
import { RecurringSeriesRepositoryProtocol } from "./protocols/recurring-series-repository-protocol";

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: RecurringSeriesRepositoryProtocol,
      useClass: RecurringSeriesRepository,
    },
  ],
  exports: [RecurringSeriesRepositoryProtocol],
})
export class RecurringSeriesRepositoriesModule {}
