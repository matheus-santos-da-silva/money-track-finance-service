import { addMonthsClamped } from "./calendar-date";

export type RecurringFrequency = "MONTHLY" | "YEARLY";

// Quantas ocorrências são geradas, no máximo, à frente de hoje.
export const RECURRENCE_HORIZON_MONTHS = 24;

const monthsPerStep = (frequency: RecurringFrequency) =>
  frequency === "YEARLY" ? 12 : 1;

// Datas das ocorrências de uma série, sempre calculadas a partir da âncora
// (31/jan mensal: 31/jan, 28/fev, 31/mar, 30/abr...). Retorna só as que ficam
// depois de `after` (exclusive) e até `upTo` (inclusive).
export const occurrenceDates = ({
  anchor,
  frequency,
  after,
  upTo,
}: {
  anchor: Date;
  frequency: RecurringFrequency;
  after: Date;
  upTo: Date;
}): Date[] => {
  const step = monthsPerStep(frequency);
  const dates: Date[] = [];

  for (let index = 1; ; index++) {
    const date = addMonthsClamped(anchor, index * step);
    if (date.getTime() > upTo.getTime()) break;
    if (date.getTime() > after.getTime()) dates.push(date);
  }

  return dates;
};

// Até onde gerar: o fim do período consultado, limitado a RECURRENCE_HORIZON_MONTHS
// à frente de hoje.
export const materializationHorizon = (requestedUntil: Date, now = new Date()): Date => {
  const limit = addMonthsClamped(now, RECURRENCE_HORIZON_MONTHS);
  return requestedUntil.getTime() < limit.getTime() ? requestedUntil : limit;
};
