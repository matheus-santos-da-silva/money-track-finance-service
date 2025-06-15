import { Expense } from "src/domain/entities/expenses/expense";
import { CreateTransactionDTO } from "src/domain/DTO/transactions/create-transaction-DTO";
import { GetExpensesResponseDTO } from "src/domain/DTO/expenses/get-expenses-response-DTO";
import { CreateExpenseResponseDTO } from "src/domain/DTO/expenses/create-expense-response-DTO";
import { GetExpenseByIdResponseDTO } from "src/domain/DTO/expenses/get-expense-by-id-response-DTO";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { GetUserTransactionsInputDTO } from "src/domain/DTO/transactions/get-transactions-input-DTO";
import { UpdateTransactionDTO } from "src/domain/DTO/transactions/update-transaction-DTO";
import { Decimal } from "@prisma/client/runtime/library";

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
      ...data,
      amount: data.amount ? new Decimal(data.amount) : currentExpense.amount,
    };
  }

  async delete(id: string): Promise<void> {
    const index = this.expenses.findIndex((expense) => expense.id === id);
    if (index === -1) this.expenses.splice(index, 1);
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

  async create(data: CreateTransactionDTO): Promise<CreateExpenseResponseDTO> {
    const id = "test-expense-id";
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
