import { context, propagation, trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import {
  ExpressInstrumentation,
  ExpressLayerType,
} from "@opentelemetry/instrumentation-express";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { KafkaJsInstrumentation } from "@opentelemetry/instrumentation-kafkajs";
import { NestInstrumentation } from "@opentelemetry/instrumentation-nestjs-core";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor, TracerProvider } from "@opentelemetry/sdk-trace";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { isInternalPath } from "./internal-paths";

let provider: TracerProvider | undefined;

const instrumentations = () => [
  new HttpInstrumentation({
    ignoreIncomingRequestHook: (req) => isInternalPath(req.url),
  }),
  new ExpressInstrumentation({
    ignoreLayersType: [ExpressLayerType.MIDDLEWARE],
    // O Nest registra middlewares (o do pino) como rota curinga (/*, /finance/*): não são rotas de verdade.
    ignoreLayers: [/\*$/],
  }),
  new NestInstrumentation(),
  // Sem pai, a query é o SELECT 1 do health check: não vira um trace solto.
  new PgInstrumentation({ requireParentSpan: true }),
  new KafkaJsInstrumentation(),
  new PinoInstrumentation({ disableLogSending: true }),
];

// Precisa rodar antes de qualquer import de http, express, pg, kafkajs ou pino (ver src/instrument.ts).
export const startTracing = (service: string): void => {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  provider = new TracerProvider({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: service }),
    // Sem endpoint os spans existem (o trace_id vai para logs e headers), mas não saem do processo.
    spanProcessors: endpoint
      ? [new BatchSpanProcessor({ exporter: new OTLPTraceExporter() })]
      : [],
  });

  trace.setGlobalTracerProvider(provider);
  context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());
  registerInstrumentations({ instrumentations: instrumentations() });
};

export const shutdownTracing = async (): Promise<void> => {
  await provider?.shutdown();
};
