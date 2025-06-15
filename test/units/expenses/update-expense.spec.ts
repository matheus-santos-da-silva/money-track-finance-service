import { Test, TestingModule } from "@nestjs/testing";
import { UpdateExpenseUseCase } from "src/application/use-cases/expenses";
import { CreateExpenseInputMock } from "../../mocks/expenses/create-expense-input-mock";
import { InMemoryExpensesRepository } from "../in-memory-repositories/expenses/in-memory-expenses-repository";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";

describe("Update Expense UseCase", () => {
  let useCase: UpdateExpenseUseCase;
  let expensesRepository: ExpensesRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateExpenseUseCase,
        {
          provide: ExpensesRepositoryProtocol,
          useClass: InMemoryExpensesRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateExpenseUseCase>(UpdateExpenseUseCase);
    expensesRepository = module.get<ExpensesRepositoryProtocol>(
      ExpensesRepositoryProtocol
    );
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
    expect(expensesRepository).toBeDefined();
  });

  it("should update a expense", async () => {
    expensesRepository.create(CreateExpenseInputMock);
    await expect(
      useCase.update({
        id: "test-expense-id",
        user_id: "test-user-id",
        data: { description: "updated-description" },
      })
    );

    const expense = await expensesRepository.findById("test-expense-id");
    expect(expense.description).toEqual("updated-description");
  });

  it("should throw an error if expense does not exists", async () => {
    await expect(
      useCase.update({
        id: "test-expense-id",
        user_id: "test-user-id",
        data: { description: "updated-description" },
      })
    ).rejects.toThrow("Despesa não existe!");
  });

  it("should throw an error if the user-id does not match the expense owner's user-id", async () => {
    expensesRepository.create(CreateExpenseInputMock);
    await expect(
      useCase.update({
        id: "test-expense-id",
        user_id: "invalid-user-id",
        data: { description: "updated-description" },
      })
    ).rejects.toThrow(
      "Esta despesa possui outro dono, tente novamente com outra!"
    );
  });
});
