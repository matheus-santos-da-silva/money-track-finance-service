import { Module } from "@nestjs/common";
import { PrismaModule } from "../../../database/config/prisma.module";
import { ExpensesRepositoryProtocol } from "./protocols/expenses-repository-protocol";
import { ExpensesRepository } from "./expenses-repository";

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: ExpensesRepositoryProtocol,
      useClass: ExpensesRepository,
    },
  ],
  exports: [ExpensesRepositoryProtocol],
})
export class ExpensesRepositoriesModule {}
