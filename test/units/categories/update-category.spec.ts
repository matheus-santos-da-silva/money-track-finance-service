import { Test, TestingModule } from "@nestjs/testing";
import { UpdateCategoryUseCase } from "../../../src/application/use-cases/categories";
import { UsersRepositoryProtocol } from "../../../src/infra/database/repositories/users/protocols/users-repository-protocol";
import { InMemoryUsersRepository } from "../in-memory-repositories/users/in-memory-users-repository";
import { InMemoryCategoriesRepository } from "../in-memory-repositories/categories/in-memory-categories-repository";
import { CategoriesRepositoryProtocol } from "../../../src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { CreateExpenseCategoryInputMock } from "../../mocks/categories/create-category-input-mock";

describe("Update Category", () => {
  let useCase: UpdateCategoryUseCase;
  let categoriesRepository: CategoriesRepositoryProtocol;
  let usersRepository: UsersRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCategoryUseCase,
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

    useCase = module.get<UpdateCategoryUseCase>(UpdateCategoryUseCase);
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

  it("should update category", async () => {
    await usersRepository.create("test-user-id", "PREMIUM", new Date());

    await categoriesRepository.create(
      "test-user-id",
      CreateExpenseCategoryInputMock
    );

    await useCase.update("test-category-id", "test-user-id", {
      name: "updated-name",
    });

    const updatedCategory = await categoriesRepository.findById({
      user_id: "test-user-id",
      category_id: "test-category-id",
    });

    expect(updatedCategory.name).toEqual("updated-name");
  });

  it("should throw an error when user not exists", () => {
    const result = useCase.update(
      "test-category-id",
      "test-user-id",
      CreateExpenseCategoryInputMock
    );

    expect(result).rejects.toThrow("Usuário não existe!");
  });

  it("should throw an error when category not exists", () => {
    usersRepository.create("test-user-id", "PREMIUM", new Date());
    const result = useCase.update(
      "test-category-id",
      "test-user-id",
      CreateExpenseCategoryInputMock
    );

    expect(result).rejects.toThrow("Categoria não encontrada!");
  });

  it("should not allow updating a default category", async () => {
    await usersRepository.create("test-user-id", "PREMIUM", new Date());
    await categoriesRepository.create(null, CreateExpenseCategoryInputMock);

    await expect(
      useCase.update("test-category-id", "test-user-id", { name: "hacked" })
    ).rejects.toThrow("Não é possível alterar uma categoria padrão!");

    const category = await categoriesRepository.findById({
      user_id: "test-user-id",
      category_id: "test-category-id",
    });
    expect(category.name).toEqual(CreateExpenseCategoryInputMock.name);
  });
});
