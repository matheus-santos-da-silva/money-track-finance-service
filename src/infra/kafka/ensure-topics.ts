import { Kafka, logLevel } from "kafkajs";
import { Logger } from "@nestjs/common";

const logger = new Logger("KafkaTopics");

const EVENT_TOPICS = ["user-created", "user-plan-updated", "user-deleted"];

// Cada tópico de evento tem uma DLQ (`<tópico>.dlq`) para mensagens que falharam.
export const KAFKA_TOPICS = [
  ...EVENT_TOPICS,
  ...EVENT_TOPICS.map((topic) => `${topic}.dlq`),
];

// O consumer assina os tópicos ao iniciar. Se algum ainda não existe (Kafka novo
// ou tópico recém-adicionado), o processo cai com UNKNOWN_TOPIC_OR_PARTITION.
// createTopics é idempotente: não faz nada para tópicos que já existem.
export const ensureKafkaTopics = async (brokers: string[]): Promise<void> => {
  const admin = new Kafka({
    clientId: "finance-service-admin",
    brokers,
    logLevel: logLevel.NOTHING,
  }).admin();

  try {
    await admin.connect();
    await admin.createTopics({
      waitForLeaders: true,
      topics: KAFKA_TOPICS.map((topic) => ({ topic })),
    });
  } catch (error) {
    logger.warn({ err: error }, "Não foi possível garantir os tópicos do Kafka");
  } finally {
    await admin.disconnect().catch(() => undefined);
  }
};
