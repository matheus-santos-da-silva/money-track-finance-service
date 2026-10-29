// Chamadas do Docker (/health, a cada 10 s) e do Prometheus (/metrics, a cada 15 s): ficam fora de logs, métricas e traces.
const INTERNAL_PATHS = ["/health", "/metrics"];

export const isInternalPath = (url = ""): boolean =>
  INTERNAL_PATHS.some((path) => url.startsWith(path));
