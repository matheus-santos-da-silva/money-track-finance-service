import { CategoryResponseDTO } from "src/domain/DTO/categories/category-response-dto";
import { GetCategoriesProtocol } from "src/domain/use-cases-protocol/categories/get-categories";
import { FindCategoriesInputDTO } from "src/domain/DTO/categories/find-categories-input-DTO";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class GetCategoriesUseCase implements GetCategoriesProtocol {
  constructor(
    private readonly repository: CategoriesRepositoryProtocol,
    private readonly usersRepository: UsersRepositoryProtocol
  ) {}

  async findAll(data: FindCategoriesInputDTO): Promise<CategoryResponseDTO[]> {
    try {
      const user = await this.usersRepository.find(data.user_id);
      if (!user) throw new BadRequestException("Usuário não existe!");

      const categories = await this.repository.findAll(data);
      return categories;
    } catch (error) {
      throw error;
    }
  }
}
