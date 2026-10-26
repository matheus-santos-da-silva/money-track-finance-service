import { randomUUID } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { NextFunction, Request, Response } from "express";

// Dados de quem originou o trabalho em andamento: uma requisição HTTP ou uma mensagem do Kafka
export interface RequestContext {
  requestId: string;
  userId?: string;
}

export const REQUEST_ID_HEADER = "x-request-id";

export const isValidRequestId = (value: string): boolean =>
  /^[A-Za-z0-9._-]{1,100}$/.test(value);

const storage = new AsyncLocalStorage<RequestContext>();

export const runWithContext = <T>(context: RequestContext, fn: () => T): T =>
  storage.run(context, fn);

export const getRequestContext = (): RequestContext | undefined =>
  storage.getStore();

export const setUserId = (userId: string): void => {
  const context = storage.getStore();
  if (context) context.userId = userId;
};

export const requestContextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const received = req.header(REQUEST_ID_HEADER)?.trim();
  const requestId =
    received && isValidRequestId(received) ? received : randomUUID();

  (req as Request & { id: string }).id = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  runWithContext({ requestId }, next);
};
