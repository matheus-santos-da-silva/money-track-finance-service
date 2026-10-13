import { Test, TestingModule } from "@nestjs/testing";
import { CreateCategoryUseCase } from "../../../src/application/use-cases/categories";
import { UsersRepositoryProtocol } from "../../../src/infra/database/repositories/users/protocols/users-repository-protocol";
import { InMemoryUsersRepository } from "../in-memory-repositories/users/in-memory-users-repository";
import { InMemoryCategoriesRepository } from "../in-memory-repositories/categories/in-memory-categories-repository";
import { CategoriesRepositoryProtocol } from "../../../src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { CreateExpenseCategoryInputMock } from "../../mocks/categories/create-category-input-mock";

describe("Create Category", () => {
  let useCase: CreateCategoryUseCase;
  let categoriesRepository: CategoriesRepositoryProtocol;
  let usersRepository: UsersRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCategoryUseCase,
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

    useCase = module.get<CreateCategoryUseCase>(CreateCategoryUseCase);
    categoriesRepository = module.get<CategoriesRepositoryProtocol>(
      CategoriesRepositoryProtocol
    );
    usersRepository = module.get<UsersRepositoryProtocol>(
      UsersRepositoryProtocol
    );
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
    expect(categoriesRepository).toBeDefined();
    expect(usersRepository).toBeDefined();
  });

  it("should create a category", () => {
    usersRepository.create("test-user-id", "PREMIUM", new Date());
    categoriesRepository.create("test-user-id", CreateExpenseCategoryInputMock);
    const result = useCase.create(
      "test-user-id",
      CreateExpenseCategoryInputMock
    );

    expect(result).resolves;
  });

  it("should throw an error when user not exists", () => {
    const result = useCase.create(
      "test-user-id",
      CreateExpenseCategoryInputMock
    );

    expect(result).rejects.toThrow("Usuário não existe!");
  });
});
