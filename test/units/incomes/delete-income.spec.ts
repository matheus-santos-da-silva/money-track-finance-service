import { Test, TestingModule } from "@nestjs/testing";
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
    incomesRepository.create(CreateIncomeInputMock);
    await expect(useCase.delete("test-income-id")).resolves.toBeUndefined();
  });

  it("should throw an error if income does not exists", async () => {
    await expect(useCase.delete("invalid-id")).rejects.toThrow(
      "Receita não existe!"
    );
  });
});
