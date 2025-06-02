import { KafkaMessage } from "@nestjs/microservices/external/kafka.interface";

export abstract class ConsumerProtocol {
  abstract execute(message: KafkaMessage): Promise<void>;
}
