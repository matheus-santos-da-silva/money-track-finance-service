import { AsyncLocalStorage } from "node:async_hooks";
import { trace } from "@opentelemetry/api";
import { NextFunction, Request, Response } from "express";

// Quem originou a requisição. O id da requisição é o trace_id do OpenTelemetry.
export interface RequestContext {
  userId?: string;
}

// Devolve o trace_id ao cliente: é o id para buscar a requisição no Grafana e nos logs.
export const REQUEST_ID_HEADER = "x-request-id";

const storage = new AsyncLocalStorage<RequestContext>();

export const getRequestContext = (): RequestContext | undefined =>
  storage.getStore();

export const setUserId = (userId: string): void => {
  const context = storage.getStore();
  if (context) context.userId = userId;
  trace.getActiveSpan()?.setAttribute("enduser.id", userId);
};

export const requestContextMiddleware = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const traceId = trace.getActiveSpan()?.spanContext().traceId;
  if (traceId) res.setHeader(REQUEST_ID_HEADER, traceId);

  storage.run({}, next);
};
