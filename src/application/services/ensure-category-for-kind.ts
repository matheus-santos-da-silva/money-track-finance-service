import { CategoryType } from "@prisma/client";
import { BadRequestException } from "@nestjs/common";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";

const KIND_LABEL: Record<CategoryType, string> = {
  EXPENSE: "despesa",
  INCOME: "receita",
};

// A categoria precisa ser do próprio usuário (ou padrão) e do tipo certo: despesa só
// usa categoria de despesa, receita só usa categoria de receita.
export const ensureCategoryForKind = async (
  categoriesRepository: CategoriesRepositoryProtocol,
  user_id: string,
  category_id: string,
  kind: CategoryType,
): Promise<{ id: string }> => {
  const category = await categoriesRepository.findAccessible({
    user_id,
    category_id,
  });

  if (!category) {
    throw new BadRequestException("Categoria não existe, tente novamente!");
  }

  if (category.type !== kind) {
    throw new BadRequestException(
      `A categoria selecionada não é uma categoria de ${KIND_LABEL[kind]}.`,
    );
  }

  return category;
};
