import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from "@nestjs/terminus";
import { PrismaService } from "src/infra/database/config/prisma.service";

const CHECK_TIMEOUT_MS = 1500;

@Controller("health")
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get("live")
  live() {
    return { status: "ok" };
  }

  // Sem o Kafka: a API do finance não depende dele, só o consumo de eventos.
  @Get("ready")
  @HealthCheck()
  ready() {
    return this.health.check([
      () =>
        this.prismaHealth.pingCheck("database", this.prisma, {
          timeout: CHECK_TIMEOUT_MS,
        }),
    ]);
  }
}
