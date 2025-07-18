import { CategoryResponseDTO } from "src/domain/DTO/categories/category-response-dto";
import { FindCategoryByIdInputDTO } from "src/domain/DTO/categories/find-category-by-id-input-DTO";

export abstract class GetCategoryByIdProtocol {
  abstract findById(
    data: FindCategoryByIdInputDTO
  ): Promise<CategoryResponseDTO>;
}
