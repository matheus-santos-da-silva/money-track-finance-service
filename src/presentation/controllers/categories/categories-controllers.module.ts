import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { CategoriesUseCasesModule } from "src/application/use-cases/categories/categories-use-cases.module";
import {
  GetCategoriesController,
  GetCategoryByIdController,
  DeleteCategoryController,
  CreateCategoryController,
  UpdateCategoryController,
} from "./";

@Module({
  imports: [CategoriesUseCasesModule],
  controllers: [
    GetCategoriesController,
    GetCategoryByIdController,
    DeleteCategoryController,
    CreateCategoryController,
    UpdateCategoryController,
  ],
  providers: [
    {
      provide: JwtService,
      useClass: JwtService,
    },
  ],
})
export class CategoriesControllersModule {}
