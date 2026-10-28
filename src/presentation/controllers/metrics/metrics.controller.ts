import { Controller, Get, Header } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { registry } from "src/shared/observability/metrics";

@Controller("metrics")
@SkipThrottle()
export class MetricsController {
  @Get()
  @Header("Content-Type", registry.contentType)
  metrics(): Promise<string> {
    return registry.metrics();
  }
}
