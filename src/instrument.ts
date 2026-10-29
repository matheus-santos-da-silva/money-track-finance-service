import "dotenv/config";
import { startTracing } from "./shared/observability/tracing";

startTracing("finance-service");
