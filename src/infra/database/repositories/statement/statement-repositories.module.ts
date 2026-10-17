import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { StatementRepository } from "./statement-repository";
import { StatementRepositoryProtocol } from "./protocols/statement-repository-protocol";

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: StatementRepositoryProtocol,
      useClass: StatementRepository,
    },
  ],
  exports: [StatementRepositoryProtocol],
})
export class StatementRepositoriesModule {}
