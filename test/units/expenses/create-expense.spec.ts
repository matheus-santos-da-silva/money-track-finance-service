import { Decimal } from "@prisma/client/runtime/client";
import { CreatedExpenseMock } from "../../mocks/expenses/created-expense-mock";
import { Test, TestingModule } from "@nestjs/testing";
import { recurringSeriesProvider } from "../helpers/recurring-series-provider";
import { CreateExpenseUseCase } from "src/application/use-cases/expenses/create-expense-use-case";
import { CreateExpenseInputMock } from "../../mocks/expenses/create-expense-input-mock";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { InMemoryUsersRepository } from "../in-memory-repositories/users/in-memory-users-repository";
import { InMemoryExpensesRepository } from "../in-memory-repositories/expenses/in-memory-expenses-repository";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { InMemoryCategoriesRepository } from "../in-memory-repositories/categories/in-memory-categories-repository";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { CreateExpenseCategoryInputMock } from "../../mocks/categories/create-category-input-mock";

describe("Create Expense UseCase", () => {
  let useCase: CreateExpenseUseCase;
  let expensesRepository: ExpensesRepositoryProtocol;
  let categoriesRepository: CategoriesRepositoryProtocol;
  let usersRepository: UsersRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateExpenseUseCase,
        recurringSeriesProvider,
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

    useCase = module.get<CreateExpenseUseCase>(CreateExpenseUseCase);
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
    expect(expensesRepository).toBeDefined();
    expect(categoriesRepository).toBeDefined();
    expect(usersRepository).toBeDefined();
  });

  it("should create a new expense", async () => {
    usersRepository.create("test-user-id", "PREMIUM", new Date());
    categoriesRepository.create("test-user-id", CreateExpenseCategoryInputMock);
    const result = await useCase.create(CreateExpenseInputMock);

    expect(result).toMatchObject({
      ...CreatedExpenseMock,
      id: result.id,
      amount: 200,
    });
  });

  it("should throw an exception when amount is equal to 0", () => {
    usersRepository.create("test-user-id", "PREMIUM", new Date());
    categoriesRepository.create("test-user-id", CreateExpenseCategoryInputMock);
    expensesRepository.create({
      ...CreateExpenseInputMock,
      amount: new Decimal(0),
    });
    const result = useCase.create({
      ...CreateExpenseInputMock,
      amount: new Decimal(0),
    });

    expect(result).rejects.toThrow(
      "Não é possível cadastrar uma despesa com o valor R$ 00,00."
    );
  });

  it("should throw an exception when category not exists", () => {
    usersRepository.create("test-user-id", "PREMIUM", new Date());
    expensesRepository.create(CreateExpenseInputMock);
    const result = useCase.create(CreateExpenseInputMock);

    expect(result).rejects.toThrow("Categoria não existe, tente novamente!");
  });

  it("should throw an exception when expense is not created successfully", () => {
    usersRepository.create("test-user-id", "PREMIUM", new Date());
    categoriesRepository.create("test-user-id", CreateExpenseCategoryInputMock);
    jest.spyOn(expensesRepository, "create").mockResolvedValue(null);
    const result = useCase.create(CreateExpenseInputMock);

    expect(result).rejects.toThrow(
      "Erro na criação da despesa, tente novamente!"
    );
  });

  it("should throw an exception when recurrence was different of NONE and has more than one installment", () => {
    usersRepository.create("test-user-id", "PREMIUM", new Date());
    categoriesRepository.create("test-user-id", CreateExpenseCategoryInputMock);
    expensesRepository.create({
      ...CreateExpenseInputMock,
      recurrence: "MONTHLY",
      total_installments: 2,
      amount: new Decimal(200),
    });

    const result = useCase.create({
      ...CreateExpenseInputMock,
      recurrence: "MONTHLY",
      total_installments: 2,
      amount: new Decimal(200),
    });

    expect(result).rejects.toThrow(
      "Não é possível cadastrar recorrência em uma despesa parcelada."
    );
  });
});
