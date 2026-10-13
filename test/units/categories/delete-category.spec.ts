import { Test, TestingModule } from "@nestjs/testing";
import { DeleteCategoryUseCase } from "../../../src/application/use-cases/categories";
import { UsersRepositoryProtocol } from "../../../src/infra/database/repositories/users/protocols/users-repository-protocol";
import { InMemoryUsersRepository } from "../in-memory-repositories/users/in-memory-users-repository";
import { InMemoryCategoriesRepository } from "../in-memory-repositories/categories/in-memory-categories-repository";
import { CategoriesRepositoryProtocol } from "../../../src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { CreateExpenseCategoryInputMock } from "../../mocks/categories/create-category-input-mock";

describe("Delete Category", () => {
  let useCase: DeleteCategoryUseCase;
  let categoriesRepository: CategoriesRepositoryProtocol;
  let usersRepository: UsersRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCategoryUseCase,
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

    useCase = module.get<DeleteCategoryUseCase>(DeleteCategoryUseCase);
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

  it("should delete category", () => {
    usersRepository.create("test-user-id", "PREMIUM", new Date());
    categoriesRepository.create("test-user-id", CreateExpenseCategoryInputMock);
    const result = useCase.delete({
      user_id: "test-user-id",
      category_id: "test-category-id",
    });

    expect(result).resolves;
  });

  it("should archive the category instead of removing it", async () => {
    await usersRepository.create("test-user-id", "PREMIUM", new Date());
    await categoriesRepository.create("test-user-id", CreateExpenseCategoryInputMock);

    await useCase.delete({ user_id: "test-user-id", category_id: "test-category-id" });

    const stored = (categoriesRepository as InMemoryCategoriesRepository).categories;
    expect(stored).toHaveLength(1);
    expect(stored[0].archived_at).toBeInstanceOf(Date);
    expect(await categoriesRepository.findAll({ user_id: "test-user-id" })).toEqual([]);
    expect(
      await categoriesRepository.findById({ user_id: "test-user-id", category_id: "test-category-id" })
    ).toBeUndefined();
  });

  it("should not delete an already archived category again", async () => {
    await usersRepository.create("test-user-id", "PREMIUM", new Date());
    await categoriesRepository.create("test-user-id", CreateExpenseCategoryInputMock);
    await useCase.delete({ user_id: "test-user-id", category_id: "test-category-id" });

    await expect(
      useCase.delete({ user_id: "test-user-id", category_id: "test-category-id" })
    ).rejects.toThrow("Categoria não encontrada!");
  });

  it("should throw an error when user not exists", () => {
    const result = useCase.delete({
      user_id: "test-user-id",
      category_id: "test-category-id",
    });

    expect(result).rejects.toThrow("Usuário não existe!");
  });

  it("should throw an error when category not exists", () => {
    usersRepository.create("test-user-id", "PREMIUM", new Date());
    const result = useCase.delete({
      user_id: "test-user-id",
      category_id: "test-category-id",
    });

    expect(result).rejects.toThrow("Categoria não encontrada!");
  });

  it("should not allow deleting a default category", async () => {
    await usersRepository.create("test-user-id", "PREMIUM", new Date());
    await categoriesRepository.create(null, CreateExpenseCategoryInputMock);

    await expect(
      useCase.delete({
        user_id: "test-user-id",
        category_id: "test-category-id",
      })
    ).rejects.toThrow("Não é possível excluir uma categoria padrão!");
  });
});
