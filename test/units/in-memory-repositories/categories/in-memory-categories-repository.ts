import { CategoryType } from "@prisma/client";
import { Category } from "src/domain/entities/categories/category";
import { FindCategoriesInputDTO } from "src/domain/DTO/categories/find-categories-input-DTO";
import { GetCategoryResponseDTO } from "src/domain/DTO/categories/get-category-response-dto";
import { FindCategoryByIdInputDTO } from "src/domain/DTO/categories/find-category-by-id-input-DTO";
import { FindCategoriesResponseDTO } from "src/domain/DTO/categories/find-categories-response-DTO";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { CreateCategoryDTO } from "src/domain/DTO/categories/create-category-DTO";
import { UpdateCategoryDTO } from "src/domain/DTO/categories/update-category-DTO";

export class InMemoryCategoriesRepository
  implements CategoriesRepositoryProtocol
{
  categories: Category[] = [];

  async create(user_id: string, data: CreateCategoryDTO): Promise<Category> {
    const category = { id: "test-category-id", ...data, user_id };
    this.categories.push(category);

    return category;
  }

  async update(
    category_id: string,
    user_id: string,
    data: UpdateCategoryDTO
  ): Promise<Category> {
    const categoryIndex = this.categories.findIndex(
      (category) => category.id === category_id && category.user_id === user_id
    );

    const currentCategory = this.categories[categoryIndex];

    this.categories[categoryIndex] = {
      ...currentCategory,
      ...data,
    };

    return {
      ...currentCategory,
      ...data,
    };
  }

  async archive(data: FindCategoryByIdInputDTO): Promise<void> {
    const category = this.categories.find(
      (category) =>
        category.user_id === data.user_id &&
        category.id === data.category_id &&
        !category.archived_at
    );

    if (category) category.archived_at = new Date();
  }

  async find(id: string): Promise<FindCategoriesResponseDTO> {
    const category = this.categories.find((category) => category.id === id);
    return category;
  }

  async findAccessible(
    data: FindCategoryByIdInputDTO
  ): Promise<{ id: string; type: CategoryType } | null> {
    const category = this.categories.find(
      (category) =>
        category.id === data.category_id &&
        (category.user_id === data.user_id || category.user_id == null) &&
        !category.archived_at
    );

    return category ? { id: category.id, type: category.type } : null;
  }

  async findById(
    data: FindCategoryByIdInputDTO
  ): Promise<GetCategoryResponseDTO> {
    const category = this.categories.find(
      (category) =>
        (category.user_id === data.user_id || category.user_id === null) &&
        category.id === data.category_id &&
        !category.archived_at
    );

    return category;
  }

  async findAll(
    data: FindCategoriesInputDTO
  ): Promise<GetCategoryResponseDTO[]> {
    let categoriesArray: Category[] = [];

    this.categories.forEach((category) => {
      if (category.archived_at) return;
      if (data.type) {
        if (
          (category.user_id === null || category.user_id === data.user_id) &&
          category.type === data.type
        ) {
          categoriesArray.push(category);
        }
      } else {
        if (category.user_id === null || category.user_id === data.user_id) {
          categoriesArray.push(category);
        }
      }
    });

    return categoriesArray;
  }
}
