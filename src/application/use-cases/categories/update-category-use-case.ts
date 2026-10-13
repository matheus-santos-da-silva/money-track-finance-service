import { UpdateCategoryDTO } from "src/domain/DTO/categories/update-category-DTO";
import { assertCanWrite } from "src/shared/transactions/plan-policy";
import { UpdateCategoryProtocol } from "src/domain/use-cases-protocol/categories";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class UpdateCategoryUseCase implements UpdateCategoryProtocol {
  constructor(
    private readonly repository: CategoriesRepositoryProtocol,
    private readonly usersRepository: UsersRepositoryProtocol
  ) {}

  async update(
    category_id: string,
    user_id: string,
    data: UpdateCategoryDTO
  ): Promise<void> {
    try {
      const user = await this.usersRepository.find(user_id);
      if (!user) throw new BadRequestException("Usuário não existe!");
      assertCanWrite(user, "editar uma categoria");

      const categoryExists = await this.repository.findById({
        user_id,
        category_id,
      });

      if (!categoryExists) {
        throw new BadRequestException("Categoria não encontrada!");
      }

      if (categoryExists.user_id !== user_id) {
        throw new BadRequestException(
          "Não é possível alterar uma categoria padrão!",
        );
      }

      const category = await this.repository.update(category_id, user_id, data);
      if (!category) {
        throw new BadRequestException("Erro ao atualizar a categoria");
      }
    } catch (error) {
      throw error;
    }
  }
}
