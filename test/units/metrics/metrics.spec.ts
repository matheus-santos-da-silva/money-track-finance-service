import { EventEmitter } from "node:events";
import { Request, Response } from "express";
import { MetricsController } from "src/presentation/controllers/metrics/metrics.controller";
import {
  configureMetrics,
  httpRequestDuration,
  metricsMiddleware,
} from "src/shared/observability/metrics";

const runRequest = (req: Partial<Request>, statusCode = 200) => {
  const res = Object.assign(new EventEmitter(), { statusCode }) as unknown as Response;
  const next = jest.fn();

  metricsMiddleware({ method: "GET", path: "/", ...req } as Request, res, next);
  res.emit("finish");

  return next;
};

const requestCount = async (labels: Record<string, string> = {}) => {
  const { values } = await httpRequestDuration.get();
  return values
    .filter((v) => v.metricName === "http_request_duration_seconds_count")
    .filter((v) =>
      Object.entries(labels).every(([key, value]) => String(v.labels[key]) === value),
    )
    .reduce((total, v) => total + v.value, 0);
};

describe("metricsMiddleware", () => {
  beforeEach(() => httpRequestDuration.reset());

  it("should label the request with the route template, not the URL", async () => {
    const next = runRequest(
      { method: "PATCH", path: "/finance/expenses/123", route: { path: "/finance/expenses/:id" } },
      204,
    );

    expect(next).toHaveBeenCalled();
    expect(
      await requestCount({ method: "PATCH", route: "/finance/expenses/:id", status_code: "204" }),
    ).toBe(1);
  });

  it("should group requests without a matching route as unmatched", async () => {
    runRequest({ path: "/nao-existe/abc" }, 404);
    runRequest({ path: "/outra/xyz", route: { path: "/finance/*" } }, 404);

    expect(await requestCount({ route: "unmatched", status_code: "404" })).toBe(2);
  });

  it("should ignore the health and metrics endpoints", async () => {
    const health = runRequest({ path: "/health/ready" });
    const metrics = runRequest({ path: "/metrics" });

    expect(health).toHaveBeenCalled();
    expect(metrics).toHaveBeenCalled();
    expect(await requestCount()).toBe(0);
  });
});

describe("MetricsController", () => {
  it("should expose the metrics in the Prometheus text format", async () => {
    configureMetrics("finance-service");

    const body = await new MetricsController().metrics();

    expect(body).toContain("# TYPE http_request_duration_seconds histogram");
    expect(body).toContain("nodejs_eventloop_lag_seconds");
    expect(body).toContain('service="finance-service"');
  });
});
