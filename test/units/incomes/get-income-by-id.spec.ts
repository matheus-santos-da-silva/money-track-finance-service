import { CreatedIncomeMock } from "../../mocks/incomes/created-income-mock";
import { Test, TestingModule } from "@nestjs/testing";
import { GetIncomeByIdUseCase } from "../../../src/application/use-cases/incomes";
import { CreateIncomeInputMock } from "../../mocks/incomes/create-income-input-mock";
import { IncomesRepositoryProtocol } from "../../../src/infra/database/repositories/incomes/protocols/incomes-repository-protocol";
import { InMemoryIncomesRepository } from "../in-memory-repositories/incomes/in-memory-incomes-repository";

describe("Get Income By Id UseCase", () => {
  let useCase: GetIncomeByIdUseCase;
  let incomesRepository: IncomesRepositoryProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetIncomeByIdUseCase,
        {
          provide: IncomesRepositoryProtocol,
          useClass: InMemoryIncomesRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetIncomeByIdUseCase>(GetIncomeByIdUseCase);
    incomesRepository = module.get<IncomesRepositoryProtocol>(
      IncomesRepositoryProtocol
    );
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
    expect(incomesRepository).toBeDefined();
  });

  it("should return a income", async () => {
    const income = await incomesRepository.create(CreateIncomeInputMock);
    const result = useCase.findById(income.id, "test-user-id");

    expect(result).resolves.toMatchObject({
      ...CreatedIncomeMock,
      id: income.id,
      amount: 200,
    });
  });

  it("should thrown an error when income not exists", () => {
    const result = useCase.findById("test-income-id", "test-user-id");
    expect(result).rejects.toThrow("Receita não existe, tente novamente!");
  });

  it("should not return a income that belongs to another user", async () => {
    const income = await incomesRepository.create(CreateIncomeInputMock);

    await expect(useCase.findById(income.id, "another-user-id")).rejects.toThrow(
      "Receita não existe, tente novamente!"
    );
  });
});
