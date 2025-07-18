import { AuthGuard } from "src/application/auth/auth.guard";
import { DeleteCategoryProtocol } from "src/domain/use-cases-protocol/categories";
import { Controller, Delete, Param, Req, UseGuards } from "@nestjs/common";

@Controller("categories")
@UseGuards(AuthGuard)
export class DeleteCategoryController {
  constructor(private readonly deleteCategoryUseCase: DeleteCategoryProtocol) {}

  @Delete(":id")
  async execute(@Req() req: Request, @Param("id") category_id: string) {
    try {
      const user = req["user"] as { id: string };

      await this.deleteCategoryUseCase.delete({
        user_id: user.id,
        category_id,
      });
    } catch (error) {
      throw error;
    }
  }
}
