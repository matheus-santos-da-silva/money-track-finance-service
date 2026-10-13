import { Test, TestingModule } from "@nestjs/testing";
import { UserCreatedConsumer } from "src/infra/kafka/consumers/user-created-consumer";
import { DeadLetterService } from "src/infra/kafka/dead-letter/dead-letter.service";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { InMemoryUsersRepository } from "../in-memory-repositories/users/in-memory-users-repository";

describe("User Created Consumer", () => {
  let consumer: UserCreatedConsumer;
  let usersRepository: InMemoryUsersRepository;

  const trialEndsAt = new Date("2026-10-12T00:00:00.000Z");

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserCreatedConsumer],
      providers: [
        {
          provide: UsersRepositoryProtocol,
          useClass: InMemoryUsersRepository,
        },
        { provide: DeadLetterService, useValue: { publish: jest.fn() } },
      ],
    }).compile();

    consumer = module.get<UserCreatedConsumer>(UserCreatedConsumer);
    usersRepository = module.get<InMemoryUsersRepository>(
      UsersRepositoryProtocol
    );
  });

  it("should create the user in the finance database", async () => {
    await consumer.execute({ id: "test-user-id", plan: "FREE", trialEndsAt });

    expect(await usersRepository.find("test-user-id")).toMatchObject({
      id: "test-user-id",
      plan: "FREE",
    });
  });

  it("should be idempotent when the same event is delivered twice", async () => {
    const message = { id: "test-user-id", plan: "FREE" as const, trialEndsAt };

    await consumer.execute(message);
    await expect(consumer.execute(message)).resolves.toBeUndefined();

    expect(usersRepository.users).toHaveLength(1);
  });

  it("should keep the plan and fill the trial date when the plan event arrived first", async () => {
    await usersRepository.updatePlan("test-user-id", "PREMIUM");

    await consumer.execute({ id: "test-user-id", plan: "FREE", trialEndsAt });

    expect(await usersRepository.find("test-user-id")).toMatchObject({
      plan: "PREMIUM",
      trialEndsAt,
    });
  });

  it("should not overwrite a newer plan when an old event is redelivered", async () => {
    await consumer.execute({ id: "test-user-id", plan: "FREE", trialEndsAt });
    await usersRepository.updatePlan("test-user-id", "PREMIUM");

    await consumer.execute({ id: "test-user-id", plan: "FREE", trialEndsAt });

    expect((await usersRepository.find("test-user-id")).plan).toEqual(
      "PREMIUM"
    );
  });
});
