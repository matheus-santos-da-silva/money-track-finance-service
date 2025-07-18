import { Module } from "@nestjs/common";
import { UsersRepositoriesModule } from "src/infra/database/repositories/users/users-repositories.module";
import { CategoriesRepositoriesModule } from "src/infra/database/repositories/categories/categories-repositories.module";
import {
  GetCategoriesUseCase,
  GetCategoryByIdUseCase,
  DeleteCategoryUseCase,
  CreateCategoryUseCase,
  UpdateCategoryUseCase,
} from "./";
import {
  GetCategoryByIdProtocol,
  GetCategoriesProtocol,
  DeleteCategoryProtocol,
  CreateCategoryProtocol,
  UpdateCategoryProtocol,
} from "src/domain/use-cases-protocol/categories/";

@Module({
  imports: [CategoriesRepositoriesModule, UsersRepositoriesModule],
  providers: [
    {
      provide: GetCategoriesProtocol,
      useClass: GetCategoriesUseCase,
    },
    {
      provide: GetCategoryByIdProtocol,
      useClass: GetCategoryByIdUseCase,
    },
    {
      provide: DeleteCategoryProtocol,
      useClass: DeleteCategoryUseCase,
    },
    {
      provide: CreateCategoryProtocol,
      useClass: CreateCategoryUseCase,
    },
    {
      provide: UpdateCategoryProtocol,
      useClass: UpdateCategoryUseCase,
    },
  ],
  exports: [
    GetCategoriesProtocol,
    GetCategoryByIdProtocol,
    DeleteCategoryProtocol,
    CreateCategoryProtocol,
    UpdateCategoryProtocol,
  ],
})
export class CategoriesUseCasesModule {}
