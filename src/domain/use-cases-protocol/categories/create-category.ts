import { Category } from "src/domain/entities/categories/category";
import { CreateCategoryDTO } from "src/domain/DTO/categories/create-category-DTO";

export abstract class CreateCategoryProtocol {
  abstract create(user_id: string, data: CreateCategoryDTO): Promise<Category>;
}
