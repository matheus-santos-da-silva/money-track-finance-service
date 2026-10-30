// Primeiro import: a telemetria precisa instrumentar http, express, pg e kafkajs antes de eles serem carregados.
import "./instrument";
import { AppModule } from "./app.module";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { RequestMethod, ValidationPipe } from "@nestjs/common";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { ensureKafkaTopics } from "./infra/kafka/ensure-topics";
import { Logger } from "nestjs-pino";
import { requestContextMiddleware } from "./shared/observability/request-context";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  // Primeiro middleware: devolve o trace_id no x-request-id e abre o contexto do usuário para os logs.
  app.use(requestContextMiddleware);
  app.enableShutdownHooks();
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
      // Grupo novo (sem offset) lê o histórico em vez de ignorá-lo. Seguro porque os consumers são idempotentes.
      subscribe: { fromBeginning: true },
    },
  });
  // /health fica fora do prefixo: mesmo caminho nos dois serviços.
  app.setGlobalPrefix("finance", {
    exclude: [
      { path: "health/live", method: RequestMethod.GET },
      { path: "health/ready", method: RequestMethod.GET },
    ],
  });
  await ensureKafkaTopics([process.env.KAFKA_URL]);
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
