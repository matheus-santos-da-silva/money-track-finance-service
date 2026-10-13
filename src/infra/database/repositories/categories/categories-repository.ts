import { CategoryType } from "@prisma/client";
import { Category } from "src/domain/entities/categories/category";
import { PrismaService } from "../../config/prisma.service";
import { CreateCategoryDTO } from "src/domain/DTO/categories/create-category-DTO";
import { UpdateCategoryDTO } from "src/domain/DTO/categories/update-category-DTO";
import { CategoryResponseDTO } from "src/domain/DTO/categories/category-response-dto";
import { FindCategoriesInputDTO } from "src/domain/DTO/categories/find-categories-input-DTO";
import { GetCategoryResponseDTO } from "src/domain/DTO/categories/get-category-response-dto";
import { FindCategoryByIdInputDTO } from "src/domain/DTO/categories/find-category-by-id-input-DTO";
import { FindCategoriesResponseDTO } from "src/domain/DTO/categories/find-categories-response-DTO";
import { CategoriesRepositoryProtocol } from "./protocols/categories-repository-protocol";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class CategoriesRepository implements CategoriesRepositoryProtocol {
  constructor(private readonly prisma: PrismaService) {}

  async findAccessible({
    user_id,
    category_id,
  }: FindCategoryByIdInputDTO): Promise<{ id: string; type: CategoryType } | null> {
    try {
      return await this.prisma.category.findFirst({
        where: {
          id: category_id,
          OR: [{ user_id }, { user_id: null }],
          archived_at: null,
        },
        select: { id: true, type: true },
      });
    } catch (error) {
      throw new BadRequestException(
        "Erro ao retornar a categoria, tente novamente!"
      );
    }
  }

  async findById({
    user_id,
    category_id,
  }: FindCategoryByIdInputDTO): Promise<CategoryResponseDTO> {
    try {
      const category = await this.prisma.category.findUnique({
        where: {
          id: category_id,
          OR: [{ user_id }, { user_id: null }],
          archived_at: null,
        },

        select: {
          id: true,
          user_id: true,
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
    user_id: string,
    data: UpdateCategoryDTO
  ): Promise<Category> {
    try {
      const category = await this.prisma.category.update({
        where: { id: category_id, user_id },
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
            archived_at: null,
            type,
          },
          select: {
            id: true,
            icon: true,
            name: true,
            user_id: true,
          },
        });

        return categories;
      }

      const categories = await this.prisma.category.findMany({
        where: {
          OR: [{ user_id }, { user_id: null }],
          archived_at: null,
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

  async archive({
    user_id,
    category_id,
  }: FindCategoryByIdInputDTO): Promise<void> {
    try {
      await this.prisma.category.updateMany({
        where: {
          id: category_id,
          user_id,
          archived_at: null,
        },
        data: { archived_at: new Date() },
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
