import { Test, TestingModule } from "@nestjs/testing";
import { DeleteExpenseUseCase } from "src/application/use-cases/expenses";
import { CreateExpenseInputMock } from "../../mocks/expenses/create-expense-input-mock";
import { InMemoryExpensesRepository } from "../in-memory-repositories/expenses/in-memory-expenses-repository";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";

describe("Delete Expense UseCase", () => {
  let useCase: DeleteExpenseUseCase;
  let expensesRepository: ExpensesRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteExpenseUseCase,
        {
          provide: ExpensesRepositoryProtocol,
          useClass: InMemoryExpensesRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteExpenseUseCase>(DeleteExpenseUseCase);
    expensesRepository = module.get<ExpensesRepositoryProtocol>(
      ExpensesRepositoryProtocol
    );
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
    expect(expensesRepository).toBeDefined();
  });

  it("should delete a expense", async () => {
    expensesRepository.create(CreateExpenseInputMock);
    await expect(
      useCase.delete({ id: "test-expense-id", user_id: "test-user-id" })
    ).resolves.toBeUndefined();
  });

  it("should throw an error if expense does not exists", async () => {
    await expect(
      useCase.delete({ id: "invalid-id", user_id: "test-user-id" })
    ).rejects.toThrow("Despesa não existe!");
  });

  it("should throw an error if the user-id does not match the expense owner's user-id", async () => {
    expensesRepository.create(CreateExpenseInputMock);
    await expect(
      useCase.delete({ id: "test-expense-id", user_id: "test-invalid-user-id" })
    ).rejects.toThrow(
      "Esta despesa possui outro dono, tente novamente com outra!"
    );
  });
});
