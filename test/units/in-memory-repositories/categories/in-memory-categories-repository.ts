import { FindCategoriesResponseDTO } from "src/domain/DTO/categories/find-categories-response-DTO";
import { Category } from "src/domain/entities/categories/category";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";

export class InMemoryCategoriesRepository
  implements CategoriesRepositoryProtocol
{
  categories: Category[] = [];

  async create(data: Category) {
    this.categories.push(data);
    return data;
  }

  async find(id: string): Promise<FindCategoriesResponseDTO> {
    const category = this.categories.find((category) => category.id === id);
    return category;
  }
}
