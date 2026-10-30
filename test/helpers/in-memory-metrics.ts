import { metrics } from "@opentelemetry/api";
import { MeterProvider, MetricReader } from "@opentelemetry/sdk-metrics";

// Coleta sob demanda: o teste lê as métricas na hora em que quiser.
class TestMetricReader extends MetricReader {
  protected onForceFlush(): Promise<void> {
    return Promise.resolve();
  }

  protected onShutdown(): Promise<void> {
    return Promise.resolve();
  }
}

const reader = new TestMetricReader();

// Chamado no setup do Jest: os contadores são criados no import dos módulos e
// só registram algo se o MeterProvider global já existir nessa hora.
export const setupInMemoryMetrics = (): void => {
  metrics.setGlobalMeterProvider(new MeterProvider({ readers: [reader] }));
};

// Valor acumulado de um contador com esses atributos (undefined se a série não existe).
export const counterValue = async (
  name: string,
  attributes: Record<string, string> = {},
): Promise<number | undefined> => {
  const { resourceMetrics } = await reader.collect();
  const metric = resourceMetrics.scopeMetrics
    .flatMap((scope) => scope.metrics)
    .find((m) => m.descriptor.name === name);
  const point = metric?.dataPoints.find((p) =>
    Object.entries(attributes).every(([key, value]) => p.attributes[key] === value),
  );

  return point?.value as number | undefined;
};
