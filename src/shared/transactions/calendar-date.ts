import { BadRequestException } from "@nestjs/common";

// A data de uma transação é um DIA de calendário, não um instante. Ela é gravada
// às 12:00 UTC desse dia: o meio-dia mantém o mesmo dia tanto em getters UTC quanto
// em getters locais, para qualquer fuso entre UTC-11 e UTC+11. Não há conta de fuso.
const CALENDAR_HOUR_UTC = 12;

const atNoonUtc = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month, day, CALENDAR_HOUR_UTC));

// Aceita "YYYY-MM-DD" (formato do app), um Date (uso interno/testes) ou nada
// (hoje, em UTC).
export const toCalendarDate = (value?: string | Date): Date => {
  if (value instanceof Date) {
    return atNoonUtc(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    );
  }

  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      throw new BadRequestException("A data deve estar no formato AAAA-MM-DD.");
    }

    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const date = atNoonUtc(year, month - 1, day);

    // Rejeita dias que não existem (ex.: 2026-02-31 viraria 03/03).
    if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      throw new BadRequestException("Data inválida.");
    }
    return date;
  }

  const now = new Date();
  return atNoonUtc(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
};

export const isSameCalendarDay = (a: Date, b: Date): boolean =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

// Soma meses a partir da data ORIGINAL, sem estourar o fim do mês
// (31/jan + 1 mês = 28/fev, e não 03/mar).
export const addMonthsClamped = (date: Date, months: number): Date => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const lastDayOfTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  return new Date(
    Date.UTC(
      year,
      month,
      Math.min(date.getUTCDate(), lastDayOfTargetMonth),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
};
