import { Test, TestingModule } from "@nestjs/testing";
import { CreateExpenseUseCase } from "src/application/use-cases/expenses/create-expense-use-case";
import { CreateExpenseServiceProtocol } from "src/domain/services/expenses/protocols/create-expense-service-protocol";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";
import { InMemoryCategoriesRepository } from "../in-memory-repositories/categories/in-memory-categories-repository";
import { InMemoryExpensesRepository } from "../in-memory-repositories/expenses/in-memory-expenses-repository";
import { CreateExpenseService } from "src/domain/services/expenses/create-expense.service";
import { CreateExpenseInputMock } from "../../mocks/expenses/create-expense-input-mock";
import { CreatedExpenseMock } from "../../mocks/expenses/created-expense-mock";
import { CreateExpenseCategoryInputMock } from "../../mocks/categories/create-category-input-mock";

describe("Create Expense UseCase", () => {
  let useCase: CreateExpenseUseCase;
  let expensesRepository: ExpensesRepositoryProtocol;
  let categoriesRepository: CategoriesRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateExpenseUseCase,
        {
          provide: ExpensesRepositoryProtocol,
          useClass: InMemoryExpensesRepository,
        },
        {
          provide: CreateExpenseServiceProtocol,
          useClass: CreateExpenseService,
        },
        {
          provide: CategoriesRepositoryProtocol,
          useClass: InMemoryCategoriesRepository,
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
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
    expect(expensesRepository).toBeDefined();
    expect(categoriesRepository).toBeDefined();
  });

  it("should create a new expense", () => {
    categoriesRepository.create(CreateExpenseCategoryInputMock);
    expensesRepository.create(CreateExpenseInputMock);
    const result = useCase.create(CreateExpenseInputMock);

    expect(result).resolves.toMatchObject(CreatedExpenseMock);
  });

  it("should throw an exception when category not exists", () => {
    expensesRepository.create(CreateExpenseInputMock);
    const result = useCase.create(CreateExpenseInputMock);

    expect(result).rejects.toThrow("Categoria não existe, tente novamente!");
  });

  it("should throw an exception when expense is not created successfully", () => {
    categoriesRepository.create(CreateExpenseCategoryInputMock);
    jest.spyOn(expensesRepository, "create").mockResolvedValue(null);
    const result = useCase.create(CreateExpenseInputMock);

    expect(result).rejects.toThrow(
      "Erro na criação da despesa, tente novamente!"
    );
  });
});
