import { FindCategoryByIdInputDTO } from "src/domain/DTO/categories/find-category-by-id-input-DTO";

export abstract class DeleteCategoryProtocol {
  abstract delete(data: FindCategoryByIdInputDTO): Promise<void>;
}
