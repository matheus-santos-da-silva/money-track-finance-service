import { context, metrics, propagation, trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
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
import { RuntimeNodeInstrumentation } from "@opentelemetry/instrumentation-runtime-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { MeterProvider, PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { BatchSpanProcessor, TracerProvider } from "@opentelemetry/sdk-trace";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { isInternalPath } from "./internal-paths";

const METRICS_EXPORT_INTERVAL_MS = 15_000;

let tracerProvider: TracerProvider | undefined;
let meterProvider: MeterProvider | undefined;

const instrumentations = () => [
  new HttpInstrumentation({
    ignoreIncomingRequestHook: (req) => isInternalPath(req.url),
  }),
  new ExpressInstrumentation({
    ignoreLayersType: [ExpressLayerType.MIDDLEWARE],
    // O Nest registra middlewares (o do pino) como rota curinga (/{*path}, /finance/{*path}): não são rotas de verdade.
    ignoreLayers: [/\{\*path\}$/],
  }),
  new NestInstrumentation(),
  // Sem pai, a query é o SELECT 1 do health check: não vira um trace solto.
  new PgInstrumentation({ requireParentSpan: true }),
  new KafkaJsInstrumentation(),
  new PinoInstrumentation({ disableLogSending: true }),
  new RuntimeNodeInstrumentation(),
];

// Precisa rodar antes de qualquer import de http, express, pg, kafkajs ou pino (ver src/instrument.ts),
// e antes de qualquer métrica ser criada: um contador criado sem o MeterProvider global não registra nada.
export const startTelemetry = (service: string): void => {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const resource = resourceFromAttributes({ [ATTR_SERVICE_NAME]: service });

  // Sem endpoint, traces e métricas existem (o trace_id vai para logs e headers), mas não saem do processo.
  tracerProvider = new TracerProvider({
    resource,
    spanProcessors: endpoint
      ? [new BatchSpanProcessor({ exporter: new OTLPTraceExporter() })]
      : [],
  });
  meterProvider = new MeterProvider({
    resource,
    readers: endpoint
      ? [
          new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter(),
            exportIntervalMillis: METRICS_EXPORT_INTERVAL_MS,
          }),
        ]
      : [],
  });

  trace.setGlobalTracerProvider(tracerProvider);
  metrics.setGlobalMeterProvider(meterProvider);
  context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());
  registerInstrumentations({ instrumentations: instrumentations() });
};

export const shutdownTelemetry = async (): Promise<void> => {
  await Promise.all([tracerProvider?.shutdown(), meterProvider?.shutdown()]);
};
