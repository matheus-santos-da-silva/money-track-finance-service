import { FindCategoriesResponseDTO } from "src/domain/DTO/categories/find-categories-response-DTO";
import { Category } from "src/domain/entities/categories/category";

export abstract class CategoriesRepositoryProtocol {
  abstract find(id: string): Promise<FindCategoriesResponseDTO>;
  abstract create(data: Category): Promise<Category>;
}
