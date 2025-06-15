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
    incomesRepository.create(CreateIncomeInputMock);
    await expect(
      useCase.update({
        id: "test-income-id",
        user_id: "test-user-id",
        data: { description: "updated-description" },
      })
    );

    const income = await incomesRepository.findById("test-income-id");
    expect(income.description).toEqual("updated-description");
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
    incomesRepository.create(CreateIncomeInputMock);
    await expect(
      useCase.update({
        id: "test-income-id",
        user_id: "invalid-user-id",
        data: { description: "updated-description" },
      })
    ).rejects.toThrow(
      "Esta receita possui outro dono, tente novamente com outra!"
    );
  });
});
