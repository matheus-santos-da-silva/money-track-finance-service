import { Test, TestingModule } from "@nestjs/testing";
import { UserDeletedConsumer } from "src/infra/kafka/consumers/user-deleted-consumer";
import { DeadLetterService } from "src/infra/kafka/dead-letter/dead-letter.service";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";
import { InMemoryUsersRepository } from "../in-memory-repositories/users/in-memory-users-repository";

describe("User Deleted Consumer", () => {
  let consumer: UserDeletedConsumer;
  let usersRepository: UsersRepositoryProtocol;
  let deadLetter: { publish: jest.Mock };

  beforeEach(async () => {
    deadLetter = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserDeletedConsumer],
      providers: [
        {
          provide: UsersRepositoryProtocol,
          useClass: InMemoryUsersRepository,
        },
        { provide: DeadLetterService, useValue: deadLetter },
      ],
    }).compile();

    consumer = module.get<UserDeletedConsumer>(UserDeletedConsumer);
    usersRepository = module.get<UsersRepositoryProtocol>(
      UsersRepositoryProtocol
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should remove the user from the finance database", async () => {
    await usersRepository.create("test-user-id", "FREE", new Date());
    await usersRepository.create("other-user-id", "FREE", new Date());

    await consumer.execute({ id: "test-user-id" });

    expect(await usersRepository.find("test-user-id")).toBeUndefined();
    expect(await usersRepository.find("other-user-id")).toBeDefined();
    expect(deadLetter.publish).not.toHaveBeenCalled();
  });

  it("should be idempotent when the user does not exist", async () => {
    await expect(
      consumer.execute({ id: "unknown-user-id" })
    ).resolves.toBeUndefined();
    expect(deadLetter.publish).not.toHaveBeenCalled();
  });

  it("should send the message to the DLQ when the repository keeps failing", async () => {
    jest.useFakeTimers();
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest
      .spyOn(usersRepository, "delete")
      .mockRejectedValue(new Error("db down"));

    const execution = consumer.execute({ id: "test-user-id" });
    await jest.runAllTimersAsync();
    await execution;

    expect(deadLetter.publish).toHaveBeenCalledWith(
      "user-deleted",
      { id: "test-user-id" },
      expect.objectContaining({ message: "db down" })
    );
  });
});
