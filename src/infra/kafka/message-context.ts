import { randomUUID } from "node:crypto";
import { Logger } from "@nestjs/common";
import { KafkaContext } from "@nestjs/microservices";
import { MessageOutcome } from "./dead-letter/with-retry-and-dlq";
import {
  ConsumeOutcome,
  kafkaMessageProcessingDuration,
  kafkaMessagesConsumedTotal,
} from "./kafka-metrics";
import {
  isValidRequestId,
  runWithContext,
} from "src/shared/observability/request-context";

// Header que o users-service coloca em cada evento com o id da requisição de origem.
export const CORRELATION_ID_HEADER = "x-correlation-id";

const logger = new Logger("KafkaConsumer");

export const correlationIdOf = (context?: KafkaContext): string | undefined => {
  const value = context
    ?.getMessage()
    .headers?.[CORRELATION_ID_HEADER]?.toString();

  return value && isValidRequestId(value) ? value : undefined;
};

// Roda o processamento de um evento dentro do mesmo contexto de log de uma requisição. No fim, uma linha resume o evento.
export const runWithMessageContext = (
  topic: string,
  context: KafkaContext | undefined,
  handler: () => Promise<MessageOutcome>,
): Promise<void> => {
  const requestId = correlationIdOf(context) ?? randomUUID();
  const position = context
    ? { partition: context.getPartition(), offset: context.getMessage().offset }
    : {};

  return runWithContext({ requestId }, async () => {
    const startedAt = performance.now();
    const durationMs = () => Math.round(performance.now() - startedAt);
    const record = (outcome: ConsumeOutcome) => {
      kafkaMessagesConsumedTotal.inc({ topic, outcome });
      kafkaMessageProcessingDuration.observe({ topic }, durationMs() / 1000);
    };

    try {
      const outcome = await handler();
      record(outcome === "processed" ? "processed" : "dead_lettered");

      if (outcome === "processed") {
        logger.log({ topic, ...position, durationMs: durationMs() }, "Evento processado");
      } else {
        logger.warn(
          { topic, ...position, durationMs: durationMs() },
          "Evento não processado: enviado para a DLQ",
        );
      }
    } catch (error) {
      record("failed");
      // Nem a DLQ aceitou: o erro sobe e o Kafka reentrega a mensagem.
      logger.error(
        { topic, ...position, durationMs: durationMs(), err: error },
        "Falha ao processar evento: será reentregue",
      );
      throw error;
    }
  });
};
