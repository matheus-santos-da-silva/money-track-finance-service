import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { shutdownTelemetry, startTelemetry } from "src/shared/observability/telemetry";

// Declaração de função: o jest.mock sobe para o topo do arquivo e precisa dela já definida.
function mockExporter() {
  return jest.fn().mockImplementation(() => ({
    export: jest.fn(),
    forceFlush: jest.fn().mockResolvedValue(undefined),
    shutdown: jest.fn().mockResolvedValue(undefined),
  }));
}

jest.mock("@opentelemetry/exporter-metrics-otlp-http", () => ({
  OTLPMetricExporter: mockExporter(),
}));
jest.mock("@opentelemetry/exporter-trace-otlp-http", () => ({
  OTLPTraceExporter: mockExporter(),
}));
jest.mock("@opentelemetry/instrumentation", () => ({
  ...jest.requireActual("@opentelemetry/instrumentation"),
  registerInstrumentations: jest.fn(),
}));

describe("startTelemetry", () => {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  afterEach(async () => {
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = endpoint;
    await shutdownTelemetry();
    jest.clearAllMocks();
  });

  it("should not export anything without an OTLP endpoint", () => {
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    startTelemetry("finance-service");

    expect(OTLPTraceExporter).not.toHaveBeenCalled();
    expect(OTLPMetricExporter).not.toHaveBeenCalled();
  });

  it("should export traces and metrics when the endpoint is set", () => {
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://otel-collector:4318";

    startTelemetry("finance-service");

    expect(OTLPTraceExporter).toHaveBeenCalledTimes(1);
    expect(OTLPMetricExporter).toHaveBeenCalledTimes(1);
  });
});
