import { AuthGuard } from "src/application/auth/auth.guard";
import { UpdateCategoryDTO } from "src/domain/DTO/categories/update-category-DTO";
import { UpdateCategoryProtocol } from "src/domain/use-cases-protocol/categories";
import {
  Controller,
  Req,
  UseGuards,
  Body,
  Patch,
  Param,
  BadRequestException,
} from "@nestjs/common";

@Controller("categories")
@UseGuards(AuthGuard)
export class UpdateCategoryController {
  constructor(private readonly updateCategoryUseCase: UpdateCategoryProtocol) {}

  @Patch(":id")
  async execute(
    @Req() req: Request,
    @Param("id") category_id: string,
    @Body() data: UpdateCategoryDTO
  ) {
    try {
      if (!data || Object.keys(data).length === 0) {
        throw new BadRequestException(
          "Nenhuma alteração foi requisitada, tente novamente passando alguma alteração!"
        );
      }

      const user = req["user"] as { id: string };

      await this.updateCategoryUseCase.update(category_id, user.id, data);
    } catch (error) {
      throw error;
    }
  }
}
