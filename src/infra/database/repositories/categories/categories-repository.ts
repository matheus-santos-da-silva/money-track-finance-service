import { Category } from "src/domain/entities/categories/category";
import { PrismaService } from "../../config/prisma.service";
import { CategoryResponseDTO } from "src/domain/DTO/categories/category-response-dto";
import { FindCategoriesInputDTO } from "src/domain/DTO/categories/find-categories-input-DTO";
import { GetCategoryResponseDTO } from "src/domain/DTO/categories/get-category-response-dto";
import { FindCategoryByIdInputDTO } from "src/domain/DTO/categories/find-category-by-id-input-DTO";
import { FindCategoriesResponseDTO } from "src/domain/DTO/categories/find-categories-response-DTO";
import { CategoriesRepositoryProtocol } from "./protocols/categories-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateCategoryDTO } from "src/domain/DTO/categories/create-category-DTO";
import { UpdateCategoryDTO } from "src/domain/DTO/categories/update-category-DTO";

@Injectable()
export class CategoriesRepository implements CategoriesRepositoryProtocol {
  constructor(private readonly prisma: PrismaService) {}

  async findById({
    user_id,
    category_id,
  }: FindCategoryByIdInputDTO): Promise<CategoryResponseDTO> {
    try {
      const category = await this.prisma.category.findUnique({
        where: {
          id: category_id,
          OR: [{ user_id }, { user_id: null }],
        },

        select: {
          id: true,
          icon: true,
          name: true,
        },
      });

      return category;
    } catch (error) {
      throw new BadRequestException(
        "Erro ao retornar a categoria, tente novamente!"
      );
    }
  }

  async create(user_id: string, data: CreateCategoryDTO): Promise<Category> {
    try {
      const category = await this.prisma.category.create({
        data: {
          user_id,
          ...data,
        },
      });

      return category;
    } catch (error) {
      throw new BadRequestException(
        "Erro ao criar a categoria, tente novamente!"
      );
    }
  }

  async update(
    category_id: string,
    data: UpdateCategoryDTO
  ): Promise<Category> {
    try {
      const category = await this.prisma.category.update({
        where: { id: category_id },
        data,
      });

      return category;
    } catch (error) {
      throw new BadRequestException(
        "Erro ao criar a categoria, tente novamente!"
      );
    }
  }

  async findAll({
    user_id,
    type,
  }: FindCategoriesInputDTO): Promise<GetCategoryResponseDTO[]> {
    try {
      if (type) {
        const categories = await this.prisma.category.findMany({
          where: {
            OR: [{ user_id }, { user_id: null }],
            type,
          },
          select: {
            id: true,
            icon: true,
            name: true,
          },
        });

        return categories;
      }

      const categories = await this.prisma.category.findMany({
        where: {
          OR: [{ user_id }, { user_id: null }],
        },
        select: {
          id: true,
          icon: true,
          name: true,
        },
      });

      return categories;
    } catch (error) {
      throw new BadRequestException(
        "Erro ao retornar as categorias, tente novamente!"
      );
    }
  }

  async delete({
    user_id,
    category_id,
  }: FindCategoryByIdInputDTO): Promise<void> {
    try {
      await this.prisma.category.delete({
        where: {
          id: category_id,
          user_id,
        },
      });
    } catch (error) {
      throw new BadRequestException(
        "Erro ao deletar a categoria, tente novamente!"
      );
    }
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
        "Erro ao retornar a categoria, tente novamente!"
      );
    }
  }
}
