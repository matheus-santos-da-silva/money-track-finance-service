import { context, trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
  TracerProvider,
} from "@opentelemetry/sdk-trace";

// Registra um tracer que guarda os spans em memória para o teste inspecionar.
export const setupInMemoryTracing = () => {
  const exporter = new InMemorySpanExporter();
  trace.setGlobalTracerProvider(
    new TracerProvider({ spanProcessors: [new SimpleSpanProcessor({ exporter })] }),
  );
  context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());

  return { exporter, tracer: trace.getTracer("test") };
};
