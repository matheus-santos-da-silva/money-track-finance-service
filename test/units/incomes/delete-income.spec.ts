import { Test, TestingModule } from "@nestjs/testing";
import { recurringSeriesProvider } from "../helpers/recurring-series-provider";
import { DeleteIncomeUseCase } from "../../../src/application/use-cases/incomes";
import { CreateIncomeInputMock } from "../../mocks/incomes/create-income-input-mock";
import { IncomesRepositoryProtocol } from "../../../src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { InMemoryIncomesRepository } from "../in-memory-repositories/incomes/in-memory-incomes-repository";

describe("Delete Income UseCase", () => {
  let useCase: DeleteIncomeUseCase;
  let incomesRepository: IncomesRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteIncomeUseCase,
        recurringSeriesProvider,
        {
          provide: IncomesRepositoryProtocol,
          useClass: InMemoryIncomesRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteIncomeUseCase>(DeleteIncomeUseCase);
    incomesRepository = module.get<IncomesRepositoryProtocol>(
      IncomesRepositoryProtocol
    );
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
    expect(incomesRepository).toBeDefined();
  });

  it("should delete a income", async () => {
    const income = await incomesRepository.create(CreateIncomeInputMock);
    await expect(
      useCase.delete({ id: income.id, user_id: "test-user-id" })
    ).resolves.toBeUndefined();
  });

  it("should delete a installmentGroup when income has total_installments greater than one and applyToAll is true", async () => {
    const income1 = await incomesRepository.create({
      ...CreateIncomeInputMock,
      total_installments: 2,
      current_installment: 1,
      installment_group_id: "test-installment_group_id",
    });

    const income2 = await incomesRepository.create({
      ...CreateIncomeInputMock,
      total_installments: 2,
      current_installment: 2,
      installment_group_id: "test-installment_group_id",
    });

    await useCase.delete({
      id: income1.id,
      user_id: "test-user-id",
      applyToAll: true,
    });

    const updatedIncome1 = await incomesRepository.findById(income1.id);
    const updatedIncome2 = await incomesRepository.findById(income2.id);

    expect(updatedIncome1).toBeUndefined();
    expect(updatedIncome2).toBeUndefined();
  });

  it("should delete only one income when income has total_installments greater than one and applyToAll is false", async () => {
    const income1 = await incomesRepository.create({
      ...CreateIncomeInputMock,
      total_installments: 2,
      current_installment: 1,
      installment_group_id: "test-installment_group_id",
    });

    const income2 = await incomesRepository.create({
      ...CreateIncomeInputMock,
      total_installments: 2,
      current_installment: 2,
      installment_group_id: "test-installment_group_id",
    });

    await useCase.delete({
      id: income1.id,
      user_id: "test-user-id",
      applyToAll: false,
    });

    const existsIncome1 = await incomesRepository.findById(income1.id);
    const existsIncome2 = await incomesRepository.findById(income2.id);

    expect(existsIncome1).toBeUndefined();
    expect(existsIncome2).toBeDefined();
  });

  it("should throw an error if income does not exists", async () => {
    await expect(
      useCase.delete({ id: "invalid-id", user_id: "test-user-id" })
    ).rejects.toThrow("Receita não existe!");
  });

  it("should throw an error if the user-id does not match the income owner's user-id", async () => {
    const income = await incomesRepository.create(CreateIncomeInputMock);
    await expect(
      useCase.delete({ id: income.id, user_id: "test-invalid-user-id" })
    ).rejects.toThrow(
      "Esta receita possui outro dono, tente novamente com outra!"
    );
  });
});
