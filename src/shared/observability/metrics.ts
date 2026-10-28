import { NextFunction, Request, Response } from "express";
import { Histogram, Registry, collectDefaultMetrics } from "prom-client";

export const registry = new Registry();

export const configureMetrics = (service: string): void => {
  registry.setDefaultLabels({ service });
  collectDefaultMetrics({ register: registry });
};

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duração das requisições HTTP, por método, rota e status",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

const IGNORED_PATHS = ["/health", "/metrics"];

// Rota-modelo (/finance/expenses/:id), nunca a URL com ids: cada valor de label vira uma série nova.
// O Nest registra middlewares (o do pino) como rota curinga (/finance/*): se só ela casou, nenhum controller atendeu.
const routeOf = (req: Request): string => {
  const path: unknown = req.route?.path;
  return typeof path === "string" && !path.endsWith("*") ? path : "unmatched";
};

// Middleware e não interceptor: o interceptor roda depois dos guards e perderia os 401 e 429.
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (IGNORED_PATHS.some((path) => req.path.startsWith(path))) return next();

  const stopTimer = httpRequestDuration.startTimer();
  res.on("finish", () => {
    stopTimer({
      method: req.method,
      route: routeOf(req),
      status_code: res.statusCode,
    });
  });
  next();
};
