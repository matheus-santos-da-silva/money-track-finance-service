import { Test, TestingModule } from "@nestjs/testing";
import { GetCategoriesUseCase } from "../../../src/application/use-cases/categories";
import { UsersRepositoryProtocol } from "../../../src/infra/database/repositories/users/protocols/users-repository-protocol";
import { InMemoryUsersRepository } from "../in-memory-repositories/users/in-memory-users-repository";
import { InMemoryCategoriesRepository } from "../in-memory-repositories/categories/in-memory-categories-repository";
import { CategoriesRepositoryProtocol } from "../../../src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { CreateExpenseCategoryInputMock } from "../../mocks/categories/create-category-input-mock";

describe("Get Categories", () => {
  let useCase: GetCategoriesUseCase;
  let categoriesRepository: CategoriesRepositoryProtocol;
  let usersRepository: UsersRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCategoriesUseCase,
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

    useCase = module.get<GetCategoriesUseCase>(GetCategoriesUseCase);
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

  it("should return the categories", () => {
    usersRepository.create("test-user-id", "PREMIUM", new Date());
    categoriesRepository.create("test-user-id", CreateExpenseCategoryInputMock);
    const result = useCase.findAll({
      user_id: "test-user-id",
    });

    expect(result).resolves.toHaveLength;
  });

  it("should throw an error when user not exists", () => {
    const result = useCase.findAll({
      user_id: "test-user-id",
    });

    expect(result).rejects.toThrow("Usuário não existe!");
  });
});
