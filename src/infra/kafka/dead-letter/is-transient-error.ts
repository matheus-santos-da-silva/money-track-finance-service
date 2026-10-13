import { Prisma } from "@prisma/client";

// Códigos do Prisma que indicam problema de infraestrutura (banco inacessível,
// timeout, conexão derrubada, pool esgotado). Com o tempo eles podem passar.
const TRANSIENT_PRISMA_CODES = new Set([
  "P1001", // não alcança o servidor do banco
  "P1002", // timeout ao alcançar o banco
  "P1008", // operação expirou
  "P1017", // servidor fechou a conexão
  "P2024", // timeout ao obter conexão do pool
  "P2028", // erro/timeout na transação
]);

// Decide se vale a pena tentar de novo. Repetir um erro determinístico (payload
// inválido, violação de constraint, bug) só atrasa o inevitável e bloqueia a
// partição, então ele deve ir direto para a DLQ.
//
// Na dúvida, trata como passageiro: errar nesse sentido custa só alguns
// segundos de espera; errar no outro manda uma falha momentânea para a DLQ.
export const isTransientError = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientValidationError) return false;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_PRISMA_CODES.has(error.code);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) return true;

  // Erros de programação/dados (ex.: payload nulo) nunca se resolvem sozinhos.
  if (
    error instanceof TypeError ||
    error instanceof RangeError ||
    error instanceof SyntaxError
  ) {
    return false;
  }

  return true;
};
