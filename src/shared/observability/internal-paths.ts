// Chamadas do Docker (/health, a cada 10 s): ficam fora de logs, métricas e traces.
const HEALTH_PATH = "/health";

export const isInternalPath = (url = ""): boolean => url.startsWith(HEALTH_PATH);
