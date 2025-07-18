import { CategoryResponseDTO } from "src/domain/DTO/categories/category-response-dto";
import { FindCategoriesInputDTO } from "src/domain/DTO/categories/find-categories-input-DTO";

export abstract class GetCategoriesProtocol {
  abstract findAll(
    data: FindCategoriesInputDTO
  ): Promise<CategoryResponseDTO[]>;
}
