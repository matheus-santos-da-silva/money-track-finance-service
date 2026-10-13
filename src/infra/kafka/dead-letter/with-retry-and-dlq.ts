import { isTransientError } from "./is-transient-error";

export interface DeadLetterPublisher {
  publish(topic: string, payload: unknown, error: unknown): Promise<void>;
}

interface WithRetryAndDlqOptions {
  topic: string;
  payload: unknown;
  handler: () => Promise<void>;
  deadLetter: DeadLetterPublisher;
  attempts?: number;
  baseDelayMs?: number;
  // Decide se o erro merece nova tentativa. Erros permanentes vão direto para a DLQ.
  isRetryable?: (error: unknown) => boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Executa o handler com retry e backoff exponencial, mas só para erros passageiros.
// Erro permanente, ou esgotadas as tentativas, envia a mensagem para `<topic>.dlq`
// e retorna normalmente, para o offset ser confirmado e a partição não ficar
// travada por uma mensagem ruim.
// Se nem a DLQ aceitar a mensagem, o erro original é relançado: o kafkajs
// reentrega a mensagem e nada é perdido.
//
// Pior caso de espera com os padrões: 0,5 s + 1 s = 1,5 s (e 0 s para erro permanente).
export const withRetryAndDlq = async ({
  topic,
  payload,
  handler,
  deadLetter,
  attempts = 3,
  baseDelayMs = 500,
  isRetryable = isTransientError,
}: WithRetryAndDlqOptions): Promise<void> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await handler();
      return;
    } catch (error) {
      lastError = error;
      const reason = error instanceof Error ? error.message : error;

      if (!isRetryable(error)) {
        console.warn(`[${topic}] erro permanente, sem retry:`, reason);
        break;
      }

      console.warn(`[${topic}] tentativa ${attempt}/${attempts} falhou:`, reason);
      if (attempt < attempts) await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  try {
    await deadLetter.publish(topic, payload, lastError);
    console.error(`[${topic}] mensagem enviada para ${topic}.dlq`);
  } catch (dlqError) {
    console.error(`[${topic}] falha ao publicar na DLQ:`, dlqError);
    throw lastError instanceof Error ? lastError : new Error("Erro desconhecido");
  }
};
