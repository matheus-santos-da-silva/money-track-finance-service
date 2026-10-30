import { Logger } from "@nestjs/common";
import { setupInMemoryMetrics } from "./helpers/in-memory-metrics";

// Os logs da aplicação não poluem a saída dos testes.
Logger.overrideLogger(false);

setupInMemoryMetrics();
