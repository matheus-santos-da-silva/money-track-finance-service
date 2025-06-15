import { Request } from "express";
import { AuthGuard } from "src/application/auth/auth.guard";
import { UpdateTransactionDTO } from "src/domain/DTO/transactions/update-transaction-DTO";
import { UpdateIncomeProtocol } from "src/domain/use-cases-protocol/incomes/update-income";
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

@Controller("incomes")
@UseGuards(AuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class UpdateIncomeController {
  constructor(private readonly updateIncomeUseCase: UpdateIncomeProtocol) {}

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
      await this.updateIncomeUseCase.update({ id, user_id: user.id, data });
    } catch (error) {
      throw error;
    }
  }
}
