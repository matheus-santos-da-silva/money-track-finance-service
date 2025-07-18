import { AuthGuard } from "src/application/auth/auth.guard";
import { CreateCategoryDTO } from "src/domain/DTO/categories/create-category-DTO";
import { CreateCategoryProtocol } from "src/domain/use-cases-protocol/categories/create-category";
import { Controller, Post, Req, UseGuards, Body } from "@nestjs/common";

@Controller("categories")
@UseGuards(AuthGuard)
export class CreateCategoryController {
  constructor(private readonly createCategoryUseCase: CreateCategoryProtocol) {}

  @Post()
  async execute(@Req() req: Request, @Body() data: CreateCategoryDTO) {
    try {
      const user = req["user"] as { id: string };

      const category = await this.createCategoryUseCase.create(user.id, data);
      return category;
    } catch (error) {
      throw error;
    }
  }
}
