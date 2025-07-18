import { AuthGuard } from "src/application/auth/auth.guard";
import { GetCategoriesProtocol } from "src/domain/use-cases-protocol/categories/get-categories";
import { GetCategoriesQueryDTO } from "src/domain/DTO/categories/get-categories-query-DTO";
import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";

@Controller("categories")
@UseGuards(AuthGuard)
export class GetCategoriesController {
  constructor(private readonly getCategoriesUseCase: GetCategoriesProtocol) {}

  @Get()
  async execute(@Req() req: Request, @Query() query: GetCategoriesQueryDTO) {
    try {
      const user = req["user"] as { id: string };

      const categories = await this.getCategoriesUseCase.findAll({
        type: query.type,
        user_id: user.id,
      });
      return categories;
    } catch (error) {
      throw error;
    }
  }
}
