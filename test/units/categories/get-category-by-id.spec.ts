import { Test, TestingModule } from "@nestjs/testing";
import { GetCategoryByIdUseCase } from "../../../src/application/use-cases/categories";
import { UsersRepositoryProtocol } from "../../../src/infra/database/repositories/users/protocols/users-repository-protocol";
import { InMemoryUsersRepository } from "../in-memory-repositories/users/in-memory-users-repository";
import { InMemoryCategoriesRepository } from "../in-memory-repositories/categories/in-memory-categories-repository";
import { CategoriesRepositoryProtocol } from "../../../src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { CreateExpenseCategoryInputMock } from "../../mocks/categories/create-category-input-mock";

describe("Get Category By Id", () => {
  let useCase: GetCategoryByIdUseCase;
  let categoriesRepository: CategoriesRepositoryProtocol;
  let usersRepository: UsersRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCategoryByIdUseCase,
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

    useCase = module.get<GetCategoryByIdUseCase>(GetCategoryByIdUseCase);
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

  it("should return a category", () => {
    usersRepository.create("test-user-id", "PREMIUM", new Date());
    categoriesRepository.create("test-user-id", CreateExpenseCategoryInputMock);
    const result = useCase.findById({
      user_id: "test-user-id",
      category_id: "test-category-id",
    });

    expect(result).resolves.toMatchObject(CreateExpenseCategoryInputMock);
  });

  it("should throw an error when user not exists", () => {
    const result = useCase.findById({
      user_id: "test-user-id",
      category_id: "test-category-id",
    });

    expect(result).rejects.toThrow("Usuário não existe!");
  });

  it("should throw an error when category not exists", () => {
    usersRepository.create("test-user-id", "PREMIUM", new Date());
    const result = useCase.findById({
      user_id: "test-user-id",
      category_id: "test-category-id",
    });

    expect(result).rejects.toThrow("Categoria não encontrada!");
  });
});
