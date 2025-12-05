import { Test, TestingModule } from "@nestjs/testing";
import { UpdateIncomeUseCase } from "../../../src/application/use-cases/incomes";
import { CreateIncomeInputMock } from "../../../test/mocks/incomes/create-income-input-mock";
import { IncomesRepositoryProtocol } from "../../../src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { InMemoryIncomesRepository } from "../in-memory-repositories/incomes/in-memory-incomes-repository";

describe("Update Income UseCase", () => {
  let useCase: UpdateIncomeUseCase;
  let incomesRepository: IncomesRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateIncomeUseCase,
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
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
    expect(incomesRepository).toBeDefined();
  });

  it("should update a income", async () => {
    const income = await incomesRepository.create(CreateIncomeInputMock);
    await expect(
      useCase.update({
        id: income.id,
        user_id: "test-user-id",
        data: { description: "updated-description" },
      })
    );

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
});
