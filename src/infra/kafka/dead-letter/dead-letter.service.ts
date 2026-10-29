import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Kafka, Producer, logLevel } from "kafkajs";
import { DeadLetterPublisher } from "./with-retry-and-dlq";

@Injectable()
export class DeadLetterService implements DeadLetterPublisher, OnModuleDestroy {
  private producer?: Producer;

  private async getProducer(): Promise<Producer> {
    if (!this.producer) {
      const producer = new Kafka({
        clientId: "finance-service-dlq",
        brokers: [process.env.KAFKA_URL],
        logLevel: logLevel.NOTHING,
      }).producer();
      await producer.connect();
      this.producer = producer;
    }
    return this.producer;
  }

  async publish(topic: string, payload: unknown, error: unknown): Promise<void> {
    const producer = await this.getProducer();

    // O traceparent da mensagem original segue para a DLQ pela instrumentação do kafkajs.
    await producer.send({
      topic: `${topic}.dlq`,
      messages: [
        {
          value: JSON.stringify({
            payload,
            error: error instanceof Error ? error.message : String(error),
            failedAt: new Date().toISOString(),
          }),
        },
      ],
    });
  }

  async onModuleDestroy() {
    await this.producer?.disconnect().catch(() => undefined);
  }
}
