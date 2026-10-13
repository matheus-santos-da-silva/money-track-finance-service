import { InMemoryExpensesRepository } from "../in-memory-repositories/expenses/in-memory-expenses-repository";
import { InMemoryIncomesRepository } from "../in-memory-repositories/incomes/in-memory-incomes-repository";
import { InMemoryRecurringSeriesRepository } from "../in-memory-repositories/recurring-series/in-memory-recurring-series-repository";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { RecurringSeriesRepositoryProtocol } from "src/infra/database/repositories/recurring-series/protocols/recurring-series-repository-protocol";

// Provider do repositório de séries ligado às "tabelas" em memória do mesmo módulo de
// teste (despesas e/ou receitas, o que estiver registrado).
export const recurringSeriesProvider = {
  provide: RecurringSeriesRepositoryProtocol,
  useFactory: (
    expenses?: InMemoryExpensesRepository,
    incomes?: InMemoryIncomesRepository,
  ) => new InMemoryRecurringSeriesRepository(expenses, incomes),
  inject: [
    { token: ExpensesRepositoryProtocol, optional: true },
    { token: IncomesRepositoryProtocol, optional: true },
  ],
};
