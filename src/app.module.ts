import { Module, OnApplicationShutdown } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./application/auth/auth.module";
import { ConsumersModule } from "./infra/kafka/consumers/consumers.module";
import { HealthControllersModule } from "./presentation/controllers/health/health-controllers.module";
import { IncomesControllersModule } from "./presentation/controllers/incomes/incomes-controllers.module";
import { ExpensesControllersModule } from "./presentation/controllers/expenses/expenses-controllers.module";
import { CategoriesControllersModule } from "./presentation/controllers/categories/categories-controllers.module";
import { TransactionsControllersModule } from "./presentation/controllers/transactions/transactions-controllers.module";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { loggerOptions } from "./shared/observability/logger-options";
import { shutdownTelemetry } from "./shared/observability/telemetry";

@Module({
  imports: [
    LoggerModule.forRoot(loggerOptions("finance-service")),
    ExpensesControllersModule,
    HealthControllersModule,
    IncomesControllersModule,
    TransactionsControllersModule,
    CategoriesControllersModule,
    ConsumersModule,
    AuthModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements OnApplicationShutdown {
  // Envia os spans e as métricas que ainda estão no buffer antes de o processo sair.
  onApplicationShutdown(): Promise<void> {
    return shutdownTelemetry();
  }
}
