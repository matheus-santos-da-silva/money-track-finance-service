import { Test, TestingModule } from "@nestjs/testing";
import { recurringSeriesProvider } from "../helpers/recurring-series-provider";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { InMemoryUsersRepository } from "../in-memory-repositories/users/in-memory-users-repository";
import { InMemoryCategoriesRepository } from "../in-memory-repositories/categories/in-memory-categories-repository";
import { CategoriesRepositoryProtocol } from "src/infra/database/repositories/categories/protocols/categories-repository-protocol";
import { UpdateIncomeUseCase } from "../../../src/application/use-cases/incomes";
import { CreateIncomeInputMock } from "../../../test/mocks/incomes/create-income-input-mock";
import { IncomesRepositoryProtocol } from "../../../src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { InMemoryIncomesRepository } from "../in-memory-repositories/incomes/in-memory-incomes-repository";

describe("Update Income UseCase", () => {
  let useCase: UpdateIncomeUseCase;
  let incomesRepository: IncomesRepositoryProtocol;
  let usersRepository: UsersRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateIncomeUseCase,
        recurringSeriesProvider,
        { provide: UsersRepositoryProtocol, useClass: InMemoryUsersRepository },
        { provide: CategoriesRepositoryProtocol, useClass: InMemoryCategoriesRepository },
        {
          provide: IncomesRepositoryProtocol,
          useClass: InMemoryIncomesRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateIncomeUseCase>(UpdateIncomeUseCase);
    incomesRepository = module.get<IncomesRepositoryProtocol>(
      IncomesRepositoryProtocol
    );

    // plano com acesso completo; os testes de plano criam o próprio usuário
    usersRepository = module.get<UsersRepositoryProtocol>(
      UsersRepositoryProtocol
    );
    await usersRepository.create("test-user-id", "PREMIUM", new Date());
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
    expect(incomesRepository).toBeDefined();
  });

  it("should update a income", async () => {
    const income = await incomesRepository.create(CreateIncomeInputMock);
    await useCase.update({
      id: income.id,
      user_id: "test-user-id",
      data: { description: "updated-description" },
    });

    const updatedIncome = await incomesRepository.findById(income.id);
    expect(updatedIncome.description).toEqual("updated-description");
  });

  it("should update a installmentGroup when income has total_installments greater than one and applyToAll is true", async () => {
    const income1 = await incomesRepository.create({
      ...CreateIncomeInputMock,
      description: "description-one",
      total_installments: 2,
      current_installment: 1,
      installment_group_id: "test-installment_group_id",
    });

    const income2 = await incomesRepository.create({
      ...CreateIncomeInputMock,
      description: "description-two",
      total_installments: 2,
      current_installment: 2,
      installment_group_id: "test-installment_group_id",
    });

    expect(
      await useCase.update({
        id: income1.id,
        user_id: "test-user-id",
        data: {
          description: "updated-description",
          installment_group_id: "test-installment_group_id",
          applyToAll: true,
        },
      })
    ).resolves;

    const updatedIncome1 = await incomesRepository.findById(income1.id);
    const updatedIncome2 = await incomesRepository.findById(income2.id);

    expect(updatedIncome1.description).toEqual(updatedIncome2.description);
  });

  it("should update only one income when income has total_installments greater than one and applyToAll is false", async () => {
    const income1 = await incomesRepository.create({
      ...CreateIncomeInputMock,
      description: "description-one",
      total_installments: 2,
      current_installment: 1,
      installment_group_id: "test-installment_group_id",
    });

    const income2 = await incomesRepository.create({
      ...CreateIncomeInputMock,
      description: "description-two",
      total_installments: 2,
      current_installment: 2,
      installment_group_id: "test-installment_group_id",
    });

    expect(
      await useCase.update({
        id: income1.id,
        user_id: "test-user-id",
        data: {
          description: "updated-description",
          installment_group_id: "test-installment_group_id",
          applyToAll: false,
        },
      })
    ).resolves;

    const updatedIncome1 = await incomesRepository.findById(income1.id);
    const updatedIncome2 = await incomesRepository.findById(income2.id);

    expect(updatedIncome1.description === updatedIncome2.description).toBeFalsy;
  });

  it("should throw an error if income does not exists", async () => {
    await expect(
      useCase.update({
        id: "test-income-id",
        user_id: "test-user-id",
        data: { description: "updated-description" },
      })
    ).rejects.toThrow("Receita não existe!");
  });

  it("should throw an error if the user-id does not match the income owner's user-id", async () => {
    const income = await incomesRepository.create(CreateIncomeInputMock);
    await expect(
      useCase.update({
        id: income.id,
        user_id: "invalid-user-id",
        data: { description: "updated-description" },
      })
    ).rejects.toThrow(
      "Esta receita possui outro dono, tente novamente com outra!"
    );
  });

  it("should not update installments of another user when applyToAll is true with a foreign installment_group_id", async () => {
    const victim = await incomesRepository.create({
      ...CreateIncomeInputMock,
      user_id: "victim-user-id",
      description: "victim-description",
      total_installments: 2,
      current_installment: 1,
      installment_group_id: "victim-group-id",
    });

    await usersRepository.create("attacker-user-id", "PREMIUM", new Date());

    const attacker = await incomesRepository.create({
      ...CreateIncomeInputMock,
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

    const victimAfter = await incomesRepository.findById(victim.id);
    const attackerAfter = await incomesRepository.findById(attacker.id);

    expect(victimAfter.description).toEqual("victim-description");
    expect(attackerAfter.description).toEqual("hacked");
  });

  it("should not change the installment_group_id of a income", async () => {
    const income = await incomesRepository.create({
      ...CreateIncomeInputMock,
      installment_group_id: "own-group-id",
    });

    await useCase.update({
      id: income.id,
      user_id: "test-user-id",
      data: { description: "new", installment_group_id: "other-group-id" },
    });

    const updated = await incomesRepository.findById(income.id);
    expect(updated.installment_group_id).toEqual("own-group-id");
  });
});
