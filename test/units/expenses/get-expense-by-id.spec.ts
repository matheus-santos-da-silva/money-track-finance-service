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

  it("should return a expense", () => {
    expensesRepository.create(CreateExpenseInputMock);
    const result = useCase.findById("test-expense-id");

    expect(result).resolves.toMatchObject({
      ...CreatedExpenseMock,
      amount: 200,
    });
  });

  it("should thrown an error when expense not exists", () => {
    const result = useCase.findById("test-expense-id");

    expect(result).rejects.toThrow("Despesa não existe, tente novamente!");
  });
});
