import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { CategoriesRepository } from "./categories-repository";
import { CategoriesRepositoryProtocol } from "./protocols/categories-repository-protocol";

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: CategoriesRepositoryProtocol,
      useClass: CategoriesRepository,
    },
  ],
  exports: [CategoriesRepositoryProtocol],
})
export class CategoriesRepositoriesModule {}
