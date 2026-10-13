import { Category } from "src/domain/entities/categories/category";
import { assertCanWrite } from "src/shared/transactions/plan-policy";
import { CreateCategoryDTO } from "src/domain/DTO/categories/create-category-DTO";
import { CreateCategoryProtocol } from "src/domain/use-cases-protocol/categories/create-category";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class CreateCategoryUseCase implements CreateCategoryProtocol {
  constructor(
    private readonly repository: CategoriesRepositoryProtocol,
    private readonly usersRepository: UsersRepositoryProtocol,
  ) {}

  async create(user_id: string, data: CreateCategoryDTO): Promise<Category> {
    try {
      const user = await this.usersRepository.find(user_id);
      if (!user) throw new BadRequestException("Usuário não existe!");

      assertCanWrite(user, "cadastrar uma categoria");

      const category = await this.repository.create(user_id, data);
      if (!category) throw new BadRequestException("Erro ao criar a categoria");

      return category;
    } catch (error) {
      throw error;
    }
  }
}
