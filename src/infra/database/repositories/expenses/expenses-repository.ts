import { PrismaService } from "../../config/prisma.service";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { UpdateTransactionDTO } from "src/domain/DTO/transactions/update-transaction-DTO";
import { GetExpensesResponseDTO } from "src/domain/DTO/expenses/get-expenses-response-DTO";
import { CreateExpenseResponseDTO } from "src/domain/DTO/expenses/create-expense-response-DTO";
import { GetExpenseByIdResponseDTO } from "src/domain/DTO/expenses/get-expense-by-id-response-DTO";
import { ExpensesRepositoryProtocol } from "./protocols/expenses-repository-protocol";
import { GetUserTransactionsInputDTO } from "src/domain/DTO/transactions/get-transactions-input-DTO";
import { BadRequestException, Injectable } from "@nestjs/common";

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
            current_installment: true,
            recurrence: true,
            transaction_date: true,
            category: {
              select: {
                name: true,
                icon: true,
              },
            },
          },
          orderBy: { transaction_date: "desc" },
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
            current_installment: true,
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
          orderBy: { transaction_date: "desc" },
        });
        return expenses;
      }
    } catch (error) {
      throw new BadRequestException(
        "Erro ao retornar as despesas, tente novamente!"
      );
    }
  }

  async update(id: string, data: UpdateTransactionDTO): Promise<void> {
    try {
      await this.prisma.expense.update({ where: { id }, data });
    } catch (error) {
      throw new BadRequestException(
        "Erro ao atualizar a despesa, tente novamente!"
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.expense.delete({ where: { id } });
    } catch (error) {
      throw new BadRequestException("Erro ao excluir a despesa");
    }
  }

  async findById(id: string): Promise<GetExpenseByIdResponseDTO> {
    try {
      const expense = await this.prisma.expense.findUnique({
        where: { id },
        select: {
          amount: true,
          category_id: true,
          description: true,
          id: true,
          total_installments: true,
          current_installment: true,
          user_id: true,
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

      return expense;
    } catch (error) {
      throw new BadRequestException(
        "Erro ao retornar a despesa, tente novamente!"
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
          current_installment: true,
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
