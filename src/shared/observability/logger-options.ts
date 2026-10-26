import { Params } from "nestjs-pino";
import { getRequestContext } from "./request-context";

// Logs de inicialização do Nest (módulos carregados, rotas mapeadas)
const BOOTSTRAP_CONTEXTS = new Set([
  "InstanceLoader",
  "RoutesResolver",
  "RouterExplorer",
]);

const INFO_LEVEL = 30;

export const loggerOptions = (service: string): Params => ({
  pinoHttp: {
    level: process.env.LOG_LEVEL ?? "info",

    base: { service },

    formatters: {
      level: (label) => ({ level: label }),
    },

    // Rebaixa para debug os logs de inicialização do Nest (ver BOOTSTRAP_CONTEXTS).
    hooks: {
      logMethod(args, method, level) {
        const [first] = args as unknown[];
        const context = (first as { context?: string } | undefined)?.context;

        if (level === INFO_LEVEL && context && BOOTSTRAP_CONTEXTS.has(context)) {
          return this.debug(...(args as Parameters<typeof this.debug>));
        }
        return method.apply(this, args);
      },
    },

    // Roda em TODO log, inclusive na linha final da requisição: quem está no
    // contexto da requisição (ou da mensagem do Kafka) ganha requestId e userId sem precisar passar nada adiante.
    mixin: () => {
      const context = getRequestContext();
      if (!context) return {};
      return context.userId
        ? { requestId: context.requestId, userId: context.userId }
        : { requestId: context.requestId };
    },

    serializers: {
      req: (req: { method: string; url: string }) => ({
        method: req.method,
        url: req.url,
      }),
      res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
    },

    customLogLevel: (_req, res, error) => {
      if (error || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },

    transport:
      process.env.LOG_FORMAT === "pretty"
        ? {
            target: "pino-pretty",
            options: {
              singleLine: true,
              translateTime: "SYS:HH:MM:ss",
              ignore: "service",
            },
          }
        : undefined,
  },
});
