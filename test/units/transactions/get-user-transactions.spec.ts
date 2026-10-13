import { toCalendarDate } from "src/shared/transactions/calendar-date";
import { Test, TestingModule } from "@nestjs/testing";
import { recurringSeriesProvider } from "../helpers/recurring-series-provider";
import { MaterializeRecurrencesService } from "src/application/services/materialize-recurrences.service";
import { CreateIncomeInputMock } from "../../../test/mocks/incomes/create-income-input-mock";
import { CreateExpenseInputMock } from "../../mocks/expenses/create-expense-input-mock";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { InMemoryUsersRepository } from "../in-memory-repositories/users/in-memory-users-repository";
import { IncomesRepositoryProtocol } from "../../../src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { InMemoryIncomesRepository } from "../in-memory-repositories/incomes/in-memory-incomes-repository";
import { GetUserTransactionsUseCase } from "../../../src/application/use-cases/transactions/get-user-transactions";
import { ExpensesRepositoryProtocol } from "../../../src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { InMemoryExpensesRepository } from "../in-memory-repositories/expenses/in-memory-expenses-repository";
import { CategoriesRepositoryProtocol } from "../../../src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { InMemoryCategoriesRepository } from "../in-memory-repositories/categories/in-memory-categories-repository";
import {
  CreateExpenseCategoryInputMock,
  CreateIncomeCategoryInputMock,
} from "../../mocks/categories/create-category-input-mock";

describe("Get User Transactions UseCase", () => {
  let useCase: GetUserTransactionsUseCase;
  let incomesRepository: IncomesRepositoryProtocol;
  let expensesRepository: ExpensesRepositoryProtocol;
  let categoriesRepository: CategoriesRepositoryProtocol;
  let usersRepository: UsersRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserTransactionsUseCase,
        MaterializeRecurrencesService,
        recurringSeriesProvider,
        {
          provide: IncomesRepositoryProtocol,
          useClass: InMemoryIncomesRepository,
        },
        {
          provide: ExpensesRepositoryProtocol,
          useClass: InMemoryExpensesRepository,
        },
        {
          provide: CategoriesRepositoryProtocol,
          useClass: InMemoryCategoriesRepository,
        },
        {
          provide: UsersRepositoryProtocol,
          useClass: InMemoryUsersRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetUserTransactionsUseCase>(
      GetUserTransactionsUseCase
    );
    incomesRepository = module.get<IncomesRepositoryProtocol>(
      IncomesRepositoryProtocol
    );
    expensesRepository = module.get<ExpensesRepositoryProtocol>(
      ExpensesRepositoryProtocol
    );
    categoriesRepository = module.get<CategoriesRepositoryProtocol>(
      CategoriesRepositoryProtocol
    );
    usersRepository = module.get<UsersRepositoryProtocol>(
      UsersRepositoryProtocol
    );
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
    expect(incomesRepository).toBeDefined();
    expect(expensesRepository).toBeDefined();
    expect(usersRepository).toBeDefined();
  });

  it("should return a empty array if user do not have transactions", () => {
    usersRepository.create("test-user-id", "PREMIUM", new Date());
    const result = useCase.find({ user_id: "test-user-id" });
    expect(result).resolves.toMatchObject({
      expenses: [],
      incomes: [],
    });
  });

  it("should return all user transactions", () => {
    usersRepository.create("test-user-id", "PREMIUM", new Date());
    categoriesRepository.create("test-user-id", CreateIncomeCategoryInputMock);
    categoriesRepository.create("test-user-id", CreateExpenseCategoryInputMock);
    incomesRepository.create(CreateIncomeInputMock);
    expensesRepository.create(CreateExpenseInputMock);

    const result = useCase.find({ user_id: "test-user-id" });

    expect(result).resolves.toMatchObject({
      expenses: [{ ...CreateExpenseInputMock, amount: 200 }],
      incomes: [{ ...CreateIncomeInputMock, amount: 200 }],
    });
  });

  it("should return user transactions on the given date", () => {
    usersRepository.create("test-user-id", "PREMIUM", new Date());
    categoriesRepository.create("test-user-id", CreateIncomeCategoryInputMock);
    incomesRepository.create({
      ...CreateIncomeInputMock,
      transaction_date: toCalendarDate(new Date("2025-04-21T12:00:00+00:00")),
    });
    incomesRepository.create({
      ...CreateIncomeInputMock,
      transaction_date: toCalendarDate(new Date("2025-04-22T12:00:00+00:00")),
    });

    const result = useCase.find({
      user_id: "test-user-id",
      start_date: new Date("2025-04-21"),
      end_date: new Date("2025-04-21"),
    });

    expect(result).resolves.toMatchObject({
      expenses: [],
      incomes: [
        expect.objectContaining({
          user_id: "test-user-id",
          category_id: "test-category-id",
          amount: 200,
          description: "Test Income",
          recurrence: "NONE",
          total_installments: 1,
        }),
      ],
    });
  });
});
