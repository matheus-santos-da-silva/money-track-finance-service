import { metrics } from "@opentelemetry/api";
import { EVENT_TOPICS } from "./ensure-topics";

export type ConsumeOutcome = "processed" | "dead_lettered" | "failed";

const OUTCOMES: ConsumeOutcome[] = ["processed", "dead_lettered", "failed"];

// A instrumentação do kafkajs já mede quantas mensagens chegam e quanto tempo levam
// (messaging.client.consumed.messages, messaging.process.duration). Aqui fica só o
// resultado, que é regra nossa: processada, enviada para a DLQ ou falhou.
export const kafkaMessagesHandledTotal = metrics
  .getMeter("finance-service")
  .createCounter("money_track.kafka.messages.handled", {
    description: "Mensagens do Kafka tratadas, por tópico e resultado",
  });

// Séries que só nasceriam no primeiro incremento: começar em 0 deixa o rate() correto desde o início.
for (const topic of EVENT_TOPICS) {
  for (const outcome of OUTCOMES) {
    kafkaMessagesHandledTotal.add(0, { "messaging.destination.name": topic, outcome });
  }
}
