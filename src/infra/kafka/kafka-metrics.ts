import { metrics } from "@opentelemetry/api";

export type ConsumeOutcome = "processed" | "dead_lettered" | "failed";

// A instrumentação do kafkajs já mede quantas mensagens chegam e quanto tempo levam
// (messaging.client.consumed.messages, messaging.process.duration). Aqui fica só o
// resultado, que é regra nossa: processada, enviada para a DLQ ou falhou.
export const kafkaMessagesHandledTotal = metrics
  .getMeter("finance-service")
  .createCounter("money_track.kafka.messages.handled", {
    description: "Mensagens do Kafka tratadas, por tópico e resultado",
  });
