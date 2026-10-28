import { Logger } from "@nestjs/common";
import { KafkaContext } from "@nestjs/microservices";
import { getRequestContext } from "src/shared/observability/request-context";
import {
  kafkaMessageProcessingDuration,
  kafkaMessagesConsumedTotal,
} from "src/infra/kafka/kafka-metrics";
import {
  CORRELATION_ID_HEADER,
  correlationIdOf,
  runWithMessageContext,
} from "src/infra/kafka/message-context";

// KafkaContext mínimo: só o que o helper lê (headers, partição e offset).
const contextWith = (headers: Record<string, Buffer> = {}) =>
  ({
    getMessage: () => ({ headers, offset: "7" }),
    getPartition: () => 0,
  }) as unknown as KafkaContext;

describe("message context", () => {
  afterEach(() => jest.restoreAllMocks());

  it("should read the correlation id sent by the users-service", () => {
    const context = contextWith({ [CORRELATION_ID_HEADER]: Buffer.from("req-42") });

    expect(correlationIdOf(context)).toBe("req-42");
  });

  it("should ignore a missing or malformed correlation id", () => {
    expect(correlationIdOf(undefined)).toBeUndefined();
    expect(correlationIdOf(contextWith())).toBeUndefined();
    expect(
      correlationIdOf(
        contextWith({ [CORRELATION_ID_HEADER]: Buffer.from('x"\n{"level":"error"}') }),
      ),
    ).toBeUndefined();
  });

  it("should run the handler with the request id of the original request", async () => {
    let seen: ReturnType<typeof getRequestContext>;
    const context = contextWith({ [CORRELATION_ID_HEADER]: Buffer.from("req-42") });

    await runWithMessageContext("user-created", context, async () => {
      seen = getRequestContext();
      return "processed";
    });

    expect(seen).toEqual({ requestId: "req-42" });
    expect(getRequestContext()).toBeUndefined();
  });

  it("should generate an id when the message has none", async () => {
    let seen: ReturnType<typeof getRequestContext>;

    await runWithMessageContext("user-created", undefined, async () => {
      seen = getRequestContext();
      return "processed";
    });

    expect(seen?.requestId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("should log the outcome of the event", async () => {
    const log = jest.spyOn(Logger.prototype, "log");
    const warn = jest.spyOn(Logger.prototype, "warn");

    await runWithMessageContext("user-created", contextWith(), async () => "processed");
    await runWithMessageContext("user-deleted", contextWith(), async () => "dead-lettered");

    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ topic: "user-created", partition: 0, offset: "7" }),
      "Evento processado",
    );
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ topic: "user-deleted" }),
      "Evento não processado: enviado para a DLQ",
    );
  });

  it("should log and rethrow when the event fails, so Kafka redelivers it", async () => {
    const error = jest.spyOn(Logger.prototype, "error");

    await expect(
      runWithMessageContext("user-created", contextWith(), async () => {
        throw new Error("dlq fora do ar");
      }),
    ).rejects.toThrow("dlq fora do ar");

    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ topic: "user-created" }),
      "Falha ao processar evento: será reentregue",
    );
  });

  it("should count consumed messages by outcome and time them", async () => {
    kafkaMessagesConsumedTotal.reset();
    kafkaMessageProcessingDuration.reset();

    await runWithMessageContext("user-created", contextWith(), async () => "processed");
    await runWithMessageContext("user-created", contextWith(), async () => "dead-lettered");
    await runWithMessageContext("user-created", contextWith(), async () => {
      throw new Error("dlq fora do ar");
    }).catch(() => undefined);

    const { values } = await kafkaMessagesConsumedTotal.get();
    expect(values.map(({ labels, value }) => ({ ...labels, value }))).toEqual(
      expect.arrayContaining([
        { topic: "user-created", outcome: "processed", value: 1 },
        { topic: "user-created", outcome: "dead_lettered", value: 1 },
        { topic: "user-created", outcome: "failed", value: 1 },
      ]),
    );
    const duration = await kafkaMessageProcessingDuration.get();
    expect(
      duration.values.find(
        (v) => v.metricName === "kafka_message_processing_duration_seconds_count",
      )?.value,
    ).toBe(3);
  });
});
