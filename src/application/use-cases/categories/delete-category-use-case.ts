import { DeleteCategoryProtocol } from "src/domain/use-cases-protocol/categories";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { FindCategoryByIdInputDTO } from "src/domain/DTO/categories/find-category-by-id-input-DTO";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class DeleteCategoryUseCase implements DeleteCategoryProtocol {
  constructor(
    private readonly repository: CategoriesRepositoryProtocol,
    private readonly usersRepository: UsersRepositoryProtocol
  ) {}

  async delete(data: FindCategoryByIdInputDTO): Promise<void> {
    try {
      const user = await this.usersRepository.find(data.user_id);
      if (!user) throw new BadRequestException("Usuário não existe!");

      const category = await this.repository.findById(data);
      if (!category) throw new BadRequestException("Categoria não encontrada!");

      await this.repository.delete(data);
    } catch (error) {
      throw error;
    }
  }
}
