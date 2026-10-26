import { Prisma } from "@prisma/client";
import { Test, TestingModule } from "@nestjs/testing";
import { UserPlanUpdatedConsumer } from "src/infra/kafka/consumers/user-plan-updated-consumer";
import { DeadLetterService } from "src/infra/kafka/dead-letter/dead-letter.service";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { InMemoryUsersRepository } from "../in-memory-repositories/users/in-memory-users-repository";

describe("User Plan Updated Consumer", () => {
  let consumer: UserPlanUpdatedConsumer;
  let usersRepository: UsersRepositoryProtocol;
  let deadLetter: { publish: jest.Mock };

  beforeEach(async () => {
    deadLetter = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPlanUpdatedConsumer],
      providers: [
        {
          provide: UsersRepositoryProtocol,
          useClass: InMemoryUsersRepository,
        },
        { provide: DeadLetterService, useValue: deadLetter },
      ],
    }).compile();

    consumer = module.get<UserPlanUpdatedConsumer>(UserPlanUpdatedConsumer);
    usersRepository = module.get<UsersRepositoryProtocol>(
      UsersRepositoryProtocol
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should update the user plan", async () => {
    await usersRepository.create("test-user-id", "FREE", new Date());

    await consumer.execute({ id: "test-user-id", plan: "PREMIUM" });

    expect((await usersRepository.find("test-user-id")).plan).toEqual(
      "PREMIUM"
    );
    expect(deadLetter.publish).not.toHaveBeenCalled();
  });

  it("should apply the plan even when the event arrives before user-created", async () => {
    await consumer.execute({ id: "test-user-id", plan: "PREMIUM" });

    expect((await usersRepository.find("test-user-id")).plan).toEqual(
      "PREMIUM"
    );
    expect(deadLetter.publish).not.toHaveBeenCalled();
  });

  it("should retry transient failures without using the DLQ", async () => {
    jest.useFakeTimers();

    const updatePlan = jest
      .spyOn(usersRepository, "updatePlan")
      .mockRejectedValueOnce(new Error("conexão perdida"))
      .mockResolvedValue(undefined);

    const execution = consumer.execute({ id: "test-user-id", plan: "PREMIUM" });
    await jest.runAllTimersAsync();
    await execution;

    expect(updatePlan).toHaveBeenCalledTimes(2);
    expect(deadLetter.publish).not.toHaveBeenCalled();
  });

  it("should send an invalid message straight to the DLQ without retrying", async () => {
    const updatePlan = jest
      .spyOn(usersRepository, "updatePlan")
      .mockRejectedValue(
        new Prisma.PrismaClientValidationError("plano inválido", {
          clientVersion: "test",
        })
      );

    // sem fake timers: se houvesse backoff, o teste ficaria esperando
    await consumer.execute({ id: "test-user-id", plan: "PLANO_INVALIDO" as any });

    expect(updatePlan).toHaveBeenCalledTimes(1);
    expect(deadLetter.publish).toHaveBeenCalledTimes(1);
  });

  it("should send the message to the DLQ when the update keeps failing", async () => {
    jest.useFakeTimers();
    jest
      .spyOn(usersRepository, "updatePlan")
      .mockRejectedValue(new Error("db down"));

    const execution = consumer.execute({ id: "test-user-id", plan: "PREMIUM" });
    await jest.runAllTimersAsync();
    await execution;

    expect(deadLetter.publish).toHaveBeenCalledWith(
      "user-plan-updated",
      { id: "test-user-id", plan: "PREMIUM" },
      expect.objectContaining({ message: "db down" })
    );
  });
});
