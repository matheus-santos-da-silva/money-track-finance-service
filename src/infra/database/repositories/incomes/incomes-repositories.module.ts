import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { IncomesRepositoryProtocol } from "./protocols/incomes-repository-protocol";
import { IncomesRepository } from "./incomes-repository";

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: IncomesRepositoryProtocol,
      useClass: IncomesRepository,
    },
  ],
  exports: [IncomesRepositoryProtocol],
})
export class IncomesRepositoriesModule {}
