import { Expense } from "src/domain/entities/expenses/expense";
import { Decimal } from "@prisma/client/runtime/client";
import { randomUUID } from "node:crypto";
import { UpdateTransactionDTO } from "src/domain/DTO/transactions/update-transaction-DTO";
import { CreateDBTransactionDTO } from "src/domain/DTO/transactions/create-db-transaction-DTO";
import { GetExpensesResponseDTO } from "src/domain/DTO/expenses/get-expenses-response-DTO";
import { CreateExpenseResponseDTO } from "src/domain/DTO/expenses/create-expense-response-DTO";
import { GetExpenseByIdResponseDTO } from "src/domain/DTO/expenses/get-expense-by-id-response-DTO";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { GetUserTransactionsInputDTO } from "src/domain/DTO/transactions/get-transactions-input-DTO";

export class InMemoryExpensesRepository implements ExpensesRepositoryProtocol {
  expenses: Expense[] = [];

  async find(
    data: GetUserTransactionsInputDTO
  ): Promise<GetExpensesResponseDTO[]> {
    if (!data.start_date && !data.end_date) {
      const encounteredExpenses: GetExpensesResponseDTO[] = [];
      this.expenses.map((expense) => {
        if (expense.user_id === data.user_id) {
          encounteredExpenses.push({
            ...expense,
            category: { name: "Alimentação", icon: "icon-test" },
            recurrence: expense.recurrence,
          });
        }
      });

      return encounteredExpenses;
    } else {
      const encounteredExpenses: GetExpensesResponseDTO[] = [];
      this.expenses.map((expense) => {
        if (
          expense.user_id === data.user_id &&
          expense.transaction_date > data.start_date &&
          expense.transaction_date < data.end_date
        ) {
          encounteredExpenses.push({
            ...expense,
            category: { name: "Alimentação", icon: "icon-test" },
            recurrence: expense.recurrence,
          });
        }
      });

      return encounteredExpenses;
    }
  }

  async update(id: string, data: UpdateTransactionDTO): Promise<void> {
    const expenseIndex = this.expenses.findIndex(
      (expense) => expense.id === id
    );

    const currentExpense = this.expenses[expenseIndex];

    if (data.amount) data.amount = new Decimal(data.amount);

    this.expenses[expenseIndex] = {
      ...currentExpense,
      ...(data as Partial<Expense>),
      amount: data.amount ? new Decimal(data.amount) : currentExpense.amount,
    };
  }

  async updateByInstallmentsGroupId(
    groupId: string,
    user_id: string,
    data: UpdateTransactionDTO
  ): Promise<void> {
    for (let i = 0; i < this.expenses.length; i++) {
      const expense = this.expenses[i];

      if (expense.installment_group_id === groupId && expense.user_id === user_id) {
        this.expenses[i] = {
          ...expense,
          ...(data as Partial<Expense>),
          amount: data.amount ? new Decimal(data.amount) : expense.amount,
        };
      }
    }
  }

  async delete(id: string): Promise<void> {
    const index = this.expenses.findIndex((expense) => expense.id === id);

    if (index !== -1) {
      this.expenses.splice(index, 1);
    }
  }

  async deleteByInstallmentsGroupId(
    groupId: string,
    user_id: string
  ): Promise<void> {
    this.expenses = this.expenses.filter(
      (expense) =>
        expense.installment_group_id !== groupId || expense.user_id !== user_id
    );
  }

  async findById(id: string): Promise<GetExpenseByIdResponseDTO> {
    const expense = this.expenses.find((expense) => expense.id === id);
    if (expense) {
      return {
        ...expense,
        category: { name: "Alimentação", icon: "icon-test" },
        recurrence: expense.recurrence,
      };
    }
  }

  async createInstallments(
    rows: CreateDBTransactionDTO[]
  ): Promise<CreateExpenseResponseDTO[]> {
    const created: CreateExpenseResponseDTO[] = [];
    for (const row of rows) created.push(await this.create(row));
    return created;
  }

  async create(data: CreateDBTransactionDTO): Promise<CreateExpenseResponseDTO> {
    const id = randomUUID();
    this.expenses.push({
      ...data,
      id,
      created_at: new Date(),
      transaction_date: data.transaction_date
        ? data.transaction_date
        : new Date(),
    });
    return { ...data, id };
  }
}
