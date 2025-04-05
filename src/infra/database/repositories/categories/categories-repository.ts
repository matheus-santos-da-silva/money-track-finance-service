import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { CategoriesRepositoryProtocol } from "./protocols/categories-repository-protocol";
import { FindCategoriesResponseDTO } from "src/domain/DTO/categories/find-categories-response-DTO";

@Injectable()
export class CategoriesRepository implements CategoriesRepositoryProtocol {
  constructor(private readonly prisma: PrismaService) {}

  async find(id: string): Promise<FindCategoriesResponseDTO> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        select: { id: true },
      });

      return category;
    } catch (error) {
      throw new BadRequestException(
        "Erro ao criar o usuário, tente novamente!"
      );
    }
  }
}
