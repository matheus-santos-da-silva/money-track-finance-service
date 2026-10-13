import { CreatedExpenseMock } from "../../mocks/expenses/created-expense-mock";
import { Test, TestingModule } from "@nestjs/testing";
import { GetExpenseByIdUseCase } from "src/application/use-cases/expenses";
import { CreateExpenseInputMock } from "../../mocks/expenses/create-expense-input-mock";
import { InMemoryExpensesRepository } from "../in-memory-repositories/expenses/in-memory-expenses-repository";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";

describe("Get Expense By Id UseCase", () => {
  let useCase: GetExpenseByIdUseCase;
  let expensesRepository: ExpensesRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetExpenseByIdUseCase,
        {
          provide: ExpensesRepositoryProtocol,
          useClass: InMemoryExpensesRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetExpenseByIdUseCase>(GetExpenseByIdUseCase);
    expensesRepository = module.get<ExpensesRepositoryProtocol>(
      ExpensesRepositoryProtocol
    );
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
    expect(expensesRepository).toBeDefined();
  });

  it("should return a expense", async () => {
    const expense = await expensesRepository.create(CreateExpenseInputMock);
    const result = useCase.findById(expense.id, "test-user-id");

    expect(result).resolves.toMatchObject({
      ...CreatedExpenseMock,
      id: expense.id,
      amount: 200,
    });
  });

  it("should throw an error when expense not exists", () => {
    const result = useCase.findById("test-expense-id", "test-user-id");
    expect(result).rejects.toThrow("Despesa não existe, tente novamente!");
  });

  it("should not return a expense that belongs to another user", async () => {
    const expense = await expensesRepository.create(CreateExpenseInputMock);

    await expect(useCase.findById(expense.id, "another-user-id")).rejects.toThrow(
      "Despesa não existe, tente novamente!"
    );
  });
});
