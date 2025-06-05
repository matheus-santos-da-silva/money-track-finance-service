import { Test, TestingModule } from "@nestjs/testing";
import { CreateIncomeUseCase } from "src/application/use-cases/incomes/create-income-use-case";
import { CreateIncomeService } from "src/domain/services/incomes/create-income.service";
import { CreateIncomeInputMock } from "../../../test/mocks/incomes/create-income-input-mock";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { InMemoryUsersRepository } from "../in-memory-repositories/users/in-memory-users-repository";
import { IncomesRepositoryProtocol } from "src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { InMemoryIncomesRepository } from "../in-memory-repositories/incomes/in-memory-incomes-repository";
import { CreateIncomeServiceProtocol } from "src/domain/services/incomes/protocols/create-income-service-protocol";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { InMemoryCategoriesRepository } from "../in-memory-repositories/categories/in-memory-categories-repository";
import { CreateIncomeCategoryInputMock } from "../../mocks/categories/create-category-input-mock";

describe("Create Income UseCase", () => {
  let useCase: CreateIncomeUseCase;
  let incomesRepository: IncomesRepositoryProtocol;
  let categoriesRepository: CategoriesRepositoryProtocol;
  let usersRepository: UsersRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateIncomeUseCase,
        {
          provide: IncomesRepositoryProtocol,
          useClass: InMemoryIncomesRepository,
        },
        {
          provide: CreateIncomeServiceProtocol,
          useClass: CreateIncomeService,
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

    useCase = module.get<CreateIncomeUseCase>(CreateIncomeUseCase);
    incomesRepository = module.get<IncomesRepositoryProtocol>(
      IncomesRepositoryProtocol
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
    expect(categoriesRepository).toBeDefined();
    expect(usersRepository).toBeDefined();
  });

  it("should create a new income", () => {
    usersRepository.create("test-user-id");
    categoriesRepository.create(CreateIncomeCategoryInputMock);
    incomesRepository.create(CreateIncomeInputMock);
    const result = useCase.create(CreateIncomeInputMock);

    expect(result).resolves.toMatchObject({
      ...CreateIncomeInputMock,
      amount: 200,
    });
  });

  it("should throw an exception when category not exists", () => {
    usersRepository.create("test-user-id");
    incomesRepository.create(CreateIncomeInputMock);
    const result = useCase.create(CreateIncomeInputMock);

    expect(result).rejects.toThrow("Categoria não existe, tente novamente!");
  });

  it("should throw an exception when income is not created successfully", () => {
    usersRepository.create("test-user-id");
    categoriesRepository.create(CreateIncomeCategoryInputMock);
    jest.spyOn(incomesRepository, "create").mockResolvedValue(null);
    const result = useCase.create(CreateIncomeInputMock);

    expect(result).rejects.toThrow(
      "Erro na criação da receita, tente novamente!"
    );
  });
});
