import { Income } from "src/domain/entities/incomes/income";
import { Decimal } from "@prisma/client/runtime/library";
import { randomUUID } from "node:crypto";
import { SetUTCDates } from "src/shared/utils/set-utc-dates";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { UpdateTransactionDTO } from "src/domain/DTO/transactions/update-transaction-DTO";
import { GetIncomesResponseDTO } from "src/domain/DTO/incomes/get-incomes-response-DTO";
import { CreateIncomeResponseDTO } from "src/domain/DTO/incomes/create-income-response-DTO";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { GetExpenseByIdResponseDTO } from "src/domain/DTO/expenses/get-expense-by-id-response-DTO";
import { GetUserTransactionsInputDTO } from "src/domain/DTO/transactions/get-transactions-input-DTO";

export class InMemoryIncomesRepository implements IncomesRepositoryProtocol {
  incomes: Income[] = [];

  async find(
    data: GetUserTransactionsInputDTO
  ): Promise<GetIncomesResponseDTO[]> {
    if (!data.start_date && !data.end_date) {
      const encounteredIncomes: GetIncomesResponseDTO[] = [];
      this.incomes.map((income) => {
        if (income.user_id === data.user_id) {
          encounteredIncomes.push({
            ...income,
            category: { name: "Lazer", icon: "icon-test" },
            recurrence: income.recurrence,
          });
        }
      });

      return encounteredIncomes;
    } else {
      const encounteredIncomes: GetIncomesResponseDTO[] = [];
      this.incomes.map((income) => {
        if (
          income.user_id === data.user_id &&
          income.transaction_date > data.start_date &&
          income.transaction_date < data.end_date
        ) {
          encounteredIncomes.push({
            ...income,
            category: { name: "Salario", icon: "icon-test" },
            recurrence: income.recurrence,
          });
        }
      });

      return encounteredIncomes;
    }
  }

  async update(id: string, data: UpdateTransactionDTO): Promise<void> {
    const incomeIndex = this.incomes.findIndex((income) => income.id === id);

    const currentIncome = this.incomes[incomeIndex];

    this.incomes[incomeIndex] = {
      ...currentIncome,
      ...data,
      amount: data.amount ? new Decimal(data.amount) : currentIncome.amount,
    };
  }

  async updateByInstallmentsGroupId(
    groupId: string,
    data: UpdateTransactionDTO
  ): Promise<void> {
    for (let i = 0; i < this.incomes.length; i++) {
      const income = this.incomes[i];

      if (income.installment_group_id === groupId) {
        this.incomes[i] = {
          ...income,
          ...data,
          amount: data.amount ? new Decimal(data.amount) : income.amount,
        };
      }
    }
  }

  async delete(id: string): Promise<void> {
    const index = this.incomes.findIndex((income) => income.id === id);
    if (index !== -1) this.incomes.splice(index, 1);
  }

  async deleteByInstallmentsGroupId(groupId: string): Promise<void> {
    this.incomes = this.incomes.filter(
      (income) => income.installment_group_id !== groupId
    );
  }

  async findById(id: string): Promise<GetExpenseByIdResponseDTO> {
    const income = this.incomes.find((income) => income.id === id);
    if (income) {
      return {
        ...income,
        category: { name: "Salario", icon: "icon-test" },
        recurrence: income.recurrence,
      };
    }
  }

  async create(data: CreateTransactionDTO): Promise<CreateIncomeResponseDTO> {
    const id = randomUUID();
    this.incomes.push({
      ...data,
      id,
      created_at: new Date(),
      transaction_date: data.transaction_date
        ? data.transaction_date
        : SetUTCDates(new Date()),
    });
    return { ...data, id };
  }
}
