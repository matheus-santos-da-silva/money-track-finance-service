import { Test, TestingModule } from "@nestjs/testing";
import { recurringSeriesProvider } from "../helpers/recurring-series-provider";
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
        recurringSeriesProvider,
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
    const expense = await expensesRepository.create(CreateExpenseInputMock);
    await expect(
      useCase.delete({ id: expense.id, user_id: "test-user-id" })
    ).resolves.toBeUndefined();
  });

  it("should delete a installmentGroup when expense has total_installments greater than one and applyToAll is true", async () => {
    const expense1 = await expensesRepository.create({
      ...CreateExpenseInputMock,
      total_installments: 2,
      current_installment: 1,
      installment_group_id: "test-installment_group_id",
    });

    const expense2 = await expensesRepository.create({
      ...CreateExpenseInputMock,
      total_installments: 2,
      current_installment: 2,
      installment_group_id: "test-installment_group_id",
    });

    await useCase.delete({
      id: expense1.id,
      user_id: "test-user-id",
      applyToAll: true,
    });

    const updatedExpense1 = await expensesRepository.findById(expense1.id);
    const updatedExpense2 = await expensesRepository.findById(expense2.id);

    expect(updatedExpense1).toBeUndefined();
    expect(updatedExpense2).toBeUndefined();
  });

  it("should delete only one expense when expense has total_installments greater than one and applyToAll is false", async () => {
    const expense1 = await expensesRepository.create({
      ...CreateExpenseInputMock,
      total_installments: 2,
      current_installment: 1,
      installment_group_id: "test-installment_group_id",
    });

    const expense2 = await expensesRepository.create({
      ...CreateExpenseInputMock,
      total_installments: 2,
      current_installment: 2,
      installment_group_id: "test-installment_group_id",
    });

    await useCase.delete({
      id: expense1.id,
      user_id: "test-user-id",
      applyToAll: false,
    });

    const updatedExpense1 = await expensesRepository.findById(expense1.id);
    const updatedExpense2 = await expensesRepository.findById(expense2.id);

    expect(updatedExpense1).toBeUndefined();
    expect(updatedExpense2).toBeDefined();
  });

  // it("should throw an error if expense does not exists", async () => {
  //   await expect(
  //     useCase.delete({ id: "invalid-id", user_id: "test-user-id" })
  //   ).rejects.toThrow("Despesa não existe!");
  // });

  // it("should throw an error if the user-id does not match the expense owner's user-id", async () => {
  //   expensesRepository.create(CreateExpenseInputMock);
  //   await expect(
  //     useCase.delete({ id: "test-expense-id", user_id: "test-invalid-user-id" })
  //   ).rejects.toThrow(
  //     "Esta despesa possui outro dono, tente novamente com outra!"
  //   );
  // });
});
