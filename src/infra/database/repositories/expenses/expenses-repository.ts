import { BadRequestException, Injectable } from "@nestjs/common";
import { ExpensesRepositoryProtocol } from "./protocols/expenses-repository-protocol";
import { PrismaService } from "../../config/prisma.service";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateExpenseResponseDTO } from "src/domain/DTO/expenses/create-expense-response-DTO";
import { GetUserTransactionsInputDTO } from "src/domain/DTO/transactions/get-transactions-input-DTO";
import { GetExpensesResponseDTO } from "src/domain/DTO/expenses/get-expenses-response-DTO";

@Injectable()
export class ExpensesRepository implements ExpensesRepositoryProtocol {
  constructor(private readonly prisma: PrismaService) {}

  async find(
    data: GetUserTransactionsInputDTO
  ): Promise<GetExpensesResponseDTO[]> {
    try {
      if (!data.start_date && !data.end_date) {
        const expenses = await this.prisma.expense.findMany({
          where: { user_id: data.user_id },
          select: {
            amount: true,
            category_id: true,
            description: true,
            id: true,
            total_installments: true,
            recurrence: true,
            transaction_date: true,
            category: {
              select: {
                name: true,
                icon: true,
              },
            },
          },
        });
        return expenses;
      } else {
        const expenses = await this.prisma.expense.findMany({
          where: {
            user_id: data.user_id,
            transaction_date: {
              gte: data.start_date,
              lte: data.end_date,
            },
          },
          select: {
            amount: true,
            category_id: true,
            description: true,
            id: true,
            total_installments: true,
            transaction_date: true,
            category: {
              select: {
                name: true,
                icon: true,
              },
            },
            created_at: true,
            recurrence: true,
          },
        });
        return expenses;
      }
    } catch (error) {
      throw new BadRequestException(
        "Erro ao retornar as despesas, tente novamente!"
      );
    }
  }

  async create(data: CreateTransactionDTO): Promise<CreateExpenseResponseDTO> {
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
