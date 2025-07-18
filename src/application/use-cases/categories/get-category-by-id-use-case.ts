import { CategoryResponseDTO } from "src/domain/DTO/categories/category-response-dto";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { GetCategoryByIdProtocol } from "src/domain/use-cases-protocol/categories/get-category-by-id";
import { FindCategoryByIdInputDTO } from "src/domain/DTO/categories/find-category-by-id-input-DTO";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class GetCategoryByIdUseCase implements GetCategoryByIdProtocol {
  constructor(
    private readonly repository: CategoriesRepositoryProtocol,
    private readonly usersRepository: UsersRepositoryProtocol
  ) {}

  async findById(data: FindCategoryByIdInputDTO): Promise<CategoryResponseDTO> {
    try {
      const user = await this.usersRepository.find(data.user_id);
      if (!user) throw new BadRequestException("Usuário não existe!");

      const category = await this.repository.findById(data);
      if (!category) throw new BadRequestException("Categoria não encontrada!");

      return category;
    } catch (error) {
      throw error;
    }
  }
}
