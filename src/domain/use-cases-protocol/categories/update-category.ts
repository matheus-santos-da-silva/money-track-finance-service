import { UpdateCategoryDTO } from "src/domain/DTO/categories/update-category-DTO";

export abstract class UpdateCategoryProtocol {
  abstract update(
    category_id: string,
    user_id: string,
    data: UpdateCategoryDTO
  ): Promise<void>;
}
