import { Logger } from "@nestjs/common";
import { KafkaContext } from "@nestjs/microservices";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { MessageOutcome } from "./dead-letter/with-retry-and-dlq";
import {
  ConsumeOutcome,
  kafkaMessageProcessingDuration,
  kafkaMessagesConsumedTotal,
} from "./kafka-metrics";

const logger = new Logger("KafkaConsumer");

// Mede, loga e marca no span o resultado de um evento. O span do consumer (com o trace de quem publicou)
// é aberto pela instrumentação do kafkajs a partir do header traceparent.
export const observeMessage = async (
  topic: string,
  context: KafkaContext | undefined,
  handler: () => Promise<MessageOutcome>,
): Promise<void> => {
  const span = trace.getActiveSpan();
  const position = context
    ? { partition: context.getPartition(), offset: context.getMessage().offset }
    : {};
  const startedAt = performance.now();
  const durationMs = () => Math.round(performance.now() - startedAt);

  const record = (outcome: ConsumeOutcome) => {
    kafkaMessagesConsumedTotal.inc({ topic, outcome });
    kafkaMessageProcessingDuration.observe({ topic }, durationMs() / 1000);
    span?.setAttribute("messaging.outcome", outcome);
    if (outcome !== "processed") {
      span?.setStatus({ code: SpanStatusCode.ERROR, message: outcome });
    }
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
};
