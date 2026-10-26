import { Logger } from "@nestjs/common";

// Os logs da aplicação não poluem a saída dos testes.
Logger.overrideLogger(false);
