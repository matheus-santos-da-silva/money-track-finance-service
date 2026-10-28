import { Counter, Histogram } from "prom-client";
import { registry } from "src/shared/observability/metrics";

export type ConsumeOutcome = "processed" | "dead_lettered" | "failed";

export const kafkaMessagesConsumedTotal = new Counter({
  name: "kafka_messages_consumed_total",
  help: "Mensagens do Kafka consumidas, por tópico e resultado",
  labelNames: ["topic", "outcome"] as const,
  registers: [registry],
});

export const kafkaMessageProcessingDuration = new Histogram({
  name: "kafka_message_processing_duration_seconds",
  help: "Duração do processamento de uma mensagem do Kafka, incluindo as novas tentativas",
  labelNames: ["topic"] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});
