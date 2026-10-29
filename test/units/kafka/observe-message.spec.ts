import { Logger } from "@nestjs/common";
import { KafkaContext } from "@nestjs/microservices";
import { SpanStatusCode } from "@opentelemetry/api";
import { observeMessage } from "src/infra/kafka/observe-message";
import { MessageOutcome } from "src/infra/kafka/dead-letter/with-retry-and-dlq";
import { setupInMemoryTracing } from "../../helpers/in-memory-tracing";
import {
  kafkaMessageProcessingDuration,
  kafkaMessagesConsumedTotal,
} from "src/infra/kafka/kafka-metrics";

const { exporter, tracer } = setupInMemoryTracing();

// KafkaContext mínimo: só o que o helper lê (partição e offset).
const contextWith = () =>
  ({
    getMessage: () => ({ headers: {}, offset: "7" }),
    getPartition: () => 0,
  }) as unknown as KafkaContext;

// Simula o span que a instrumentação do kafkajs abre para cada mensagem.
const insideConsumerSpan = (handler: () => Promise<MessageOutcome>) =>
  tracer.startActiveSpan("user-created process", async (span) => {
    try {
      await observeMessage("user-created", contextWith(), handler);
    } finally {
      span.end();
    }
  });

const lastSpan = () => exporter.getFinishedSpans().at(-1);

describe("observeMessage", () => {
  beforeEach(() => exporter.reset());
  afterEach(() => jest.restoreAllMocks());

  it("should log the outcome of the event", async () => {
    const log = jest.spyOn(Logger.prototype, "log");
    const warn = jest.spyOn(Logger.prototype, "warn");

    await observeMessage("user-created", contextWith(), async () => "processed");
    await observeMessage("user-deleted", contextWith(), async () => "dead-lettered");

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
      observeMessage("user-created", contextWith(), async () => {
        throw new Error("dlq fora do ar");
      }),
    ).rejects.toThrow("dlq fora do ar");

    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ topic: "user-created" }),
      "Falha ao processar evento: será reentregue",
    );
  });

  it("should mark the outcome on the consumer span", async () => {
    await insideConsumerSpan(async () => "processed");

    expect(lastSpan()?.attributes["messaging.outcome"]).toBe("processed");
    expect(lastSpan()?.status.code).toBe(SpanStatusCode.UNSET);
  });

  it("should mark the consumer span as error when the event is not processed", async () => {
    await insideConsumerSpan(async () => "dead-lettered");
    expect(lastSpan()?.attributes["messaging.outcome"]).toBe("dead_lettered");
    expect(lastSpan()?.status.code).toBe(SpanStatusCode.ERROR);

    await insideConsumerSpan(async () => {
      throw new Error("dlq fora do ar");
    }).catch(() => undefined);
    expect(lastSpan()?.attributes["messaging.outcome"]).toBe("failed");
    expect(lastSpan()?.status.code).toBe(SpanStatusCode.ERROR);
  });

  it("should count consumed messages by outcome and time them", async () => {
    kafkaMessagesConsumedTotal.reset();
    kafkaMessageProcessingDuration.reset();

    await observeMessage("user-created", contextWith(), async () => "processed");
    await observeMessage("user-created", contextWith(), async () => "dead-lettered");
    await observeMessage("user-created", contextWith(), async () => {
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
