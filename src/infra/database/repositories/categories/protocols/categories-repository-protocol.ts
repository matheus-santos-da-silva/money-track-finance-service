import { FindCategoriesResponseDTO } from "src/domain/DTO/categories/find-categories-response-DTO";

export abstract class CategoriesRepositoryProtocol {
  abstract find(id: string): Promise<FindCategoriesResponseDTO>;
}
