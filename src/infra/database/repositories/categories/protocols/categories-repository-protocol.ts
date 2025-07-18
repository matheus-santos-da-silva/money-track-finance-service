import { Category } from "src/domain/entities/categories/category";
import { CreateCategoryDTO } from "src/domain/DTO/categories/create-category-DTO";
import { UpdateCategoryDTO } from "src/domain/DTO/categories/update-category-DTO";
import { CategoryResponseDTO } from "src/domain/DTO/categories/category-response-dto";
import { FindCategoriesInputDTO } from "src/domain/DTO/categories/find-categories-input-DTO";
import { GetCategoryResponseDTO } from "src/domain/DTO/categories/get-category-response-dto";
import { FindCategoryByIdInputDTO } from "src/domain/DTO/categories/find-category-by-id-input-DTO";
import { FindCategoriesResponseDTO } from "src/domain/DTO/categories/find-categories-response-DTO";

export abstract class CategoriesRepositoryProtocol {
  abstract find(id: string): Promise<FindCategoriesResponseDTO>;

  abstract findById(
    data: FindCategoryByIdInputDTO
  ): Promise<CategoryResponseDTO>;

  abstract findAll(
    data: FindCategoriesInputDTO
  ): Promise<GetCategoryResponseDTO[]>;

  abstract update(
    category_id: string,
    data: UpdateCategoryDTO
  ): Promise<Category>;

  abstract delete(data: FindCategoryByIdInputDTO): Promise<void>;
  abstract create(user_id: string, data: CreateCategoryDTO): Promise<Category>;
}
