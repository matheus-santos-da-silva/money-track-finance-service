import { BadRequestException, Injectable } from "@nestjs/common";
import { IncomesRepositoryProtocol } from "./protocols/incomes-repository-protocol";
import { PrismaService } from "../../config/prisma.service";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { CreateIncomeResponseDTO } from "src/domain/DTO/incomes/create-income-response-DTO";
import { GetIncomesResponseDTO } from "src/domain/DTO/incomes/get-incomes-response-DTO";
import { GetUserTransactionsInputDTO } from "src/domain/DTO/transactions/get-transactions-input-DTO";

@Injectable()
export class IncomesRepository implements IncomesRepositoryProtocol {
  constructor(private readonly prisma: PrismaService) {}

  async find(
    data: GetUserTransactionsInputDTO
  ): Promise<GetIncomesResponseDTO[]> {
    try {
      if (!data.start_date && !data.end_date) {
        const incomes = await this.prisma.income.findMany({
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
          orderBy: { transaction_date: "desc" },
        });
        return incomes;
      } else {
        const incomes = await this.prisma.income.findMany({
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

        return incomes;
      }
    } catch (error) {
      throw new BadRequestException(
        "Erro ao retornar as receitas, tente novamente!"
      );
    }
  }

  async create(data: CreateTransactionDTO): Promise<CreateIncomeResponseDTO> {
    try {
      const income = await this.prisma.income.create({
        data,
        select: {
          amount: true,
          category_id: true,
          description: true,
          id: true,
          total_installments: true,
        },
      });

      return income;
    } catch (error) {
      throw new BadRequestException(
        "Erro ao criar a receita, tente novamente!"
      );
    }
  }
}
