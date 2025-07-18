import { AuthGuard } from "src/application/auth/auth.guard";
import { GetCategoryByIdProtocol } from "src/domain/use-cases-protocol/categories/get-category-by-id";
import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";

@Controller("categories")
@UseGuards(AuthGuard)
export class GetCategoryByIdController {
  constructor(
    private readonly getCategoryByIdUseCase: GetCategoryByIdProtocol
  ) {}

  @Get(":id")
  async execute(@Req() req: Request, @Param("id") category_id: string) {
    try {
      const user = req["user"] as { id: string };

      const category = await this.getCategoryByIdUseCase.findById({
        user_id: user.id,
        category_id,
      });

      return category;
    } catch (error) {
      throw error;
    }
  }
}
