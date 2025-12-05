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
    const expense = await expensesRepository.create(CreateExpenseInputMock);
    await expect(
      useCase.update({
        id: expense.id,
        user_id: "test-user-id",
        data: { description: "updated-description" },
      })
    );

    const updatedExpense = await expensesRepository.findById(expense.id);
    expect(updatedExpense.description).toEqual("updated-description");
  });

  it("should update a installmentGroup when expense has total_installments greater than one and applyToAll is true", async () => {
    const expense1 = await expensesRepository.create({
      ...CreateExpenseInputMock,
      description: "description-one",
      total_installments: 2,
      current_installment: 1,
      installment_group_id: "test-installment_group_id",
    });

    const expense2 = await expensesRepository.create({
      ...CreateExpenseInputMock,
      description: "description-two",
      total_installments: 2,
      current_installment: 2,
      installment_group_id: "test-installment_group_id",
    });

    expect(
      await useCase.update({
        id: expense1.id,
        user_id: "test-user-id",
        data: {
          description: "updated-description",
          installment_group_id: "test-installment_group_id",
          applyToAll: true,
        },
      })
    ).resolves;

    const updatedExpense1 = await expensesRepository.findById(expense1.id);
    const updatedExpense2 = await expensesRepository.findById(expense2.id);

    expect(updatedExpense1.description).toEqual(updatedExpense2.description);
  });

  it("should update only one expense when expense has total_installments greater than one and applyToAll is false", async () => {
    const expense1 = await expensesRepository.create({
      ...CreateExpenseInputMock,
      description: "description-one",
      total_installments: 2,
      current_installment: 1,
      installment_group_id: "test-installment_group_id",
    });

    const expense2 = await expensesRepository.create({
      ...CreateExpenseInputMock,
      description: "description-two",
      total_installments: 2,
      current_installment: 2,
      installment_group_id: "test-installment_group_id",
    });

    expect(
      await useCase.update({
        id: expense1.id,
        user_id: "test-user-id",
        data: {
          description: "updated-description",
          installment_group_id: "test-installment_group_id",
          applyToAll: false,
        },
      })
    ).resolves;

    const updatedExpense1 = await expensesRepository.findById(expense1.id);
    const updatedExpense2 = await expensesRepository.findById(expense2.id);

    expect(updatedExpense1.description === updatedExpense2.description)
      .toBeFalsy;
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
    const expense = await expensesRepository.create(CreateExpenseInputMock);
    await expect(
      useCase.update({
        id: expense.id,
        user_id: "invalid-user-id",
        data: { description: "updated-description" },
      })
    ).rejects.toThrow(
      "Esta despesa possui outro dono, tente novamente com outra!"
    );
  });
});
