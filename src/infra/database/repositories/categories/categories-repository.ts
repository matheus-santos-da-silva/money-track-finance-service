import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { CategoriesRepositoryProtocol } from "./protocols/categories-repository-protocol";
import { FindCategoriesResponseDTO } from "src/domain/DTO/categories/find-categories-response-DTO";
import { Category } from "src/domain/entities/categories/category";

@Injectable()
export class CategoriesRepository implements CategoriesRepositoryProtocol {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Category): Promise<Category> {
    throw new Error("Method not implemented.");
  }

  async find(id: string): Promise<FindCategoriesResponseDTO> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        select: { id: true },
      });

      return category;
    } catch (error) {
      throw new BadRequestException(
        "Erro ao criar a categoria, tente novamente!"
      );
    }
  }
}
