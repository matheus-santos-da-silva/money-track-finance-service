import { withRetryAndDlq } from "src/infra/kafka/dead-letter/with-retry-and-dlq";

describe("withRetryAndDlq", () => {
  let deadLetter: { publish: jest.Mock };

  beforeEach(() => {
    deadLetter = { publish: jest.fn().mockResolvedValue(undefined) };
  });

  afterEach(() => jest.restoreAllMocks());

  const run2 = (
    handler: () => Promise<void>,
    isRetryable: (error: unknown) => boolean
  ) =>
    withRetryAndDlq({
      topic: "user-created",
      payload: { id: "test-user-id" },
      handler,
      deadLetter,
      attempts: 3,
      baseDelayMs: 1,
      isRetryable,
    });

  const run = (handler: () => Promise<void>) =>
    withRetryAndDlq({
      topic: "user-created",
      payload: { id: "test-user-id" },
      handler,
      deadLetter,
      attempts: 3,
      baseDelayMs: 1,
    });

  it("should run the handler once and not touch the DLQ on success", async () => {
    const handler = jest.fn().mockResolvedValue(undefined);

    await expect(run(handler)).resolves.toBe("processed");

    expect(handler).toHaveBeenCalledTimes(1);
    expect(deadLetter.publish).not.toHaveBeenCalled();
  });

  it("should send a permanent error straight to the DLQ without retrying or waiting", async () => {
    const error = new TypeError("payload nulo");
    const handler = jest.fn().mockRejectedValue(error);

    const startedAt = Date.now();
    await withRetryAndDlq({
      topic: "user-created",
      payload: { id: "test-user-id" },
      handler,
      deadLetter,
      baseDelayMs: 5_000, // se houvesse retry, o teste estouraria o tempo
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(deadLetter.publish).toHaveBeenCalledWith(
      "user-created",
      { id: "test-user-id" },
      error
    );
    expect(Date.now() - startedAt).toBeLessThan(1_000);
  });

  it("should honor a custom isRetryable", async () => {
    const handler = jest.fn().mockRejectedValue(new Error("qualquer"));

    await run2(handler, () => false);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(deadLetter.publish).toHaveBeenCalledTimes(1);
  });

  it("should use 3 attempts by default", async () => {
    const handler = jest.fn().mockRejectedValue(new Error("passageiro"));

    await withRetryAndDlq({
      topic: "user-created",
      payload: {},
      handler,
      deadLetter,
      baseDelayMs: 1,
    });

    expect(handler).toHaveBeenCalledTimes(3);
  });

  it("should retry and succeed without using the DLQ", async () => {
    const handler = jest
      .fn()
      .mockRejectedValueOnce(new Error("temporário"))
      .mockRejectedValueOnce(new Error("temporário"))
      .mockResolvedValue(undefined);

    await run(handler);

    expect(handler).toHaveBeenCalledTimes(3);
    expect(deadLetter.publish).not.toHaveBeenCalled();
  });

  it("should send the message to the DLQ after exhausting the attempts and resolve", async () => {
    const error = new Error("permanente");
    const handler = jest.fn().mockRejectedValue(error);

    await expect(run(handler)).resolves.toBe("dead-lettered");

    expect(handler).toHaveBeenCalledTimes(3);
    expect(deadLetter.publish).toHaveBeenCalledWith(
      "user-created",
      { id: "test-user-id" },
      error
    );
  });

  it("should rethrow the original error when the DLQ also fails, so the message is redelivered", async () => {
    deadLetter.publish.mockRejectedValue(new Error("dlq fora do ar"));
    const handler = jest.fn().mockRejectedValue(new Error("permanente"));

    await expect(run(handler)).rejects.toThrow("permanente");
  });
});
