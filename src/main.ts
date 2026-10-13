import "dotenv/config";
import { AppModule } from "./app.module";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { ensureKafkaTopics } from "./infra/kafka/ensure-topics";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Atrás do Caddy, req.ip precisa ser o IP real do cliente (X-Forwarded-For);
  // senão o rate limit (Throttler) conta todos os usuários como um só.
  app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? 1));
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_URL],
      },
      consumer: {
        groupId: "finance-service-group",
      },
      // Grupo novo (sem offset) lê o histórico em vez de ignorá-lo. Seguro porque
      // os consumers são idempotentes.
      subscribe: { fromBeginning: true },
    },
  });
  app.setGlobalPrefix('finance');
  await ensureKafkaTopics([process.env.KAFKA_URL]);
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
