import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { CategoriesRepositoryProtocol } from "./protocols/categories-repository-protocol";
import { CategoriesRepository } from "./categories-repository";

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
