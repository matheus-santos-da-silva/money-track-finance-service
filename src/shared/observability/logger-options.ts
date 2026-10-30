import { RequestMethod } from "@nestjs/common";
import { Params } from "nestjs-pino";
import { getRequestContext } from "./request-context";
import { isInternalPath } from "./internal-paths";

// Logs de inicialização do Nest (módulos carregados, rotas mapeadas)
const BOOTSTRAP_CONTEXTS = new Set([
  "InstanceLoader",
  "RoutesResolver",
  "RouterExplorer",
]);

const INFO_LEVEL = 30;

export const loggerOptions = (service: string): Params => ({
  // Sintaxe de curinga do Express 5; o padrão do nestjs-pino ("*") gera aviso a cada boot.
  forRoutes: [{ path: "{*path}", method: RequestMethod.ALL }],

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

    // Roda em todo log da requisição. O trace_id e o span_id vêm da instrumentação do pino (ver telemetry.ts).
    mixin: () => {
      const userId = getRequestContext()?.userId;
      return userId ? { userId } : {};
    },

    serializers: {
      req: (req: { method: string; url: string }) => ({
        method: req.method,
        url: req.url,
      }),
      res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
    },

    autoLogging: {
      ignore: (req) => isInternalPath(req.url),
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
