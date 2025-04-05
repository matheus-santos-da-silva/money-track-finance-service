import { BadRequestException, Injectable } from "@nestjs/common";
import { ExpensesRepositoryProtocol } from "./protocols/expenses-repository-protocol";
import { PrismaService } from "../../config/prisma.service";
import { CreateFinancialEntryDTO } from "src/domain/DTO/create-financial-entry-DTO";
import { CreateExpenseResponseDTO } from "src/domain/DTO/expenses/create-expense-response-DTO";

@Injectable()
export class ExpensesRepository implements ExpensesRepositoryProtocol {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateFinancialEntryDTO
  ): Promise<CreateExpenseResponseDTO> {
    try {
      const expense = await this.prisma.expense.create({
        data,
        select: {
          amount: true,
          category_id: true,
          description: true,
          id: true,
          total_installments: true,
        },
      });

      return expense;
    } catch (error) {
      throw new BadRequestException(
        "Erro ao criar a despesa, tente novamente!"
      );
    }
  }
}
