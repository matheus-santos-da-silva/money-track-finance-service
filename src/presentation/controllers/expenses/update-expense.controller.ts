import { Request } from "express";
import { AuthGuard } from "src/application/auth/auth.guard";
import { UpdateTransactionDTO } from "src/domain/DTO/transactions/update-transaction-DTO";
import { UpdateExpenseProtocol } from "src/domain/use-cases-protocol/expenses";
import {
  Controller,
  UseGuards,
  Patch,
  Param,
  Req,
  Body,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";

@Controller("expenses")
@UseGuards(AuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class UpdateExpenseController {
  constructor(private readonly updateExpenseUseCase: UpdateExpenseProtocol) {}

  @Patch(":id")
  async execute(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() data: UpdateTransactionDTO
  ) {
    try {
      if (Object.keys(data).length === 0) {
        throw new BadRequestException(
          "Nenhuma alteração foi requisitada, tente novamente passando alguma alteração!"
        );
      }

      const user = req["user"] as { id: string };

      await this.updateExpenseUseCase.update({ id, user_id: user.id, data });
    } catch (error) {
      throw error;
    }
  }
}
