import { Test, TestingModule } from "@nestjs/testing";
import { recurringSeriesProvider } from "../helpers/recurring-series-provider";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { InMemoryUsersRepository } from "../in-memory-repositories/users/in-memory-users-repository";
import { InMemoryCategoriesRepository } from "../in-memory-repositories/categories/in-memory-categories-repository";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { UpdateExpenseUseCase } from "src/application/use-cases/expenses";
import { CreateExpenseInputMock } from "../../mocks/expenses/create-expense-input-mock";
import { InMemoryExpensesRepository } from "../in-memory-repositories/expenses/in-memory-expenses-repository";
import { ExpensesRepositoryProtocol } from "src/infra/database/repositories/expenses/protocols/expenses-repository-protocol";

describe("Update Expense UseCase", () => {
  let useCase: UpdateExpenseUseCase;
  let expensesRepository: ExpensesRepositoryProtocol;
  let usersRepository: UsersRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateExpenseUseCase,
        recurringSeriesProvider,
        { provide: UsersRepositoryProtocol, useClass: InMemoryUsersRepository },
        { provide: CategoriesRepositoryProtocol, useClass: InMemoryCategoriesRepository },
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

    // plano com acesso completo; os testes de plano criam o próprio usuário
    usersRepository = module.get<UsersRepositoryProtocol>(
      UsersRepositoryProtocol
    );
    await usersRepository.create("test-user-id", "PREMIUM", new Date());
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
    expect(expensesRepository).toBeDefined();
  });

  it("should update a expense", async () => {
    const expense = await expensesRepository.create(CreateExpenseInputMock);
    await useCase.update({
      id: expense.id,
      user_id: "test-user-id",
      data: { description: "updated-description" },
    });

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

  it("should not update installments of another user when applyToAll is true with a foreign installment_group_id", async () => {
    const victim = await expensesRepository.create({
      ...CreateExpenseInputMock,
      user_id: "victim-user-id",
      description: "victim-description",
      total_installments: 2,
      current_installment: 1,
      installment_group_id: "victim-group-id",
    });

    await usersRepository.create("attacker-user-id", "PREMIUM", new Date());

    const attacker = await expensesRepository.create({
      ...CreateExpenseInputMock,
      user_id: "attacker-user-id",
      total_installments: 2,
      current_installment: 1,
      installment_group_id: "attacker-group-id",
    });

    await useCase.update({
      id: attacker.id,
      user_id: "attacker-user-id",
      data: {
        description: "hacked",
        installment_group_id: "victim-group-id",
        applyToAll: true,
      },
    });

    const victimAfter = await expensesRepository.findById(victim.id);
    const attackerAfter = await expensesRepository.findById(attacker.id);

    expect(victimAfter.description).toEqual("victim-description");
    expect(attackerAfter.description).toEqual("hacked");
  });

  it("should not change the installment_group_id of a expense", async () => {
    const expense = await expensesRepository.create({
      ...CreateExpenseInputMock,
      installment_group_id: "own-group-id",
    });

    await useCase.update({
      id: expense.id,
      user_id: "test-user-id",
      data: { description: "new", installment_group_id: "other-group-id" },
    });

    const updated = await expensesRepository.findById(expense.id);
    expect(updated.installment_group_id).toEqual("own-group-id");
  });
});
