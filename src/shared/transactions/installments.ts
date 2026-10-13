import { Prisma } from "@prisma/client";
import { BadRequestException } from "@nestjs/common";
import { addMonthsClamped } from "./calendar-date";

// Divide o total em centavos inteiros. Os centavos que sobram vão 1 a 1 para as
// primeiras parcelas, então a diferença entre parcelas nunca passa de 1 centavo:
// R$ 100 em 3x = 33,34 + 33,33 + 33,33.
export const splitIntoCents = (
  amount: Prisma.Decimal | number | string,
  parts: number,
): number[] => {
  // Decimal evita o erro de ponto flutuante (1.15 * 100 em JS = 114.99999999999999).
  const totalCents = new Prisma.Decimal(amount).times(100).toNumber();

  if (!Number.isInteger(totalCents)) {
    throw new BadRequestException("O valor deve ter no máximo 2 casas decimais.");
  }

  if (totalCents < parts) {
    throw new BadRequestException(
      `O valor é baixo demais para ${parts} parcelas (mínimo de R$ 0,01 por parcela).`,
    );
  }

  const baseCents = Math.floor(totalCents / parts);
  const leftoverCents = totalCents - baseCents * parts;

  return Array.from(
    { length: parts },
    (_, index) => baseCents + (index < leftoverCents ? 1 : 0),
  );
};

export interface InstallmentPlan {
  amount: Prisma.Decimal;
  current_installment: number;
  total_installments: number;
  transaction_date: Date;
  installment_group_id: string;
}

// Monta todas as parcelas de uma compra: valores em centavos, uma data por mês
// (sempre calculada a partir da data da 1ª parcela) e o mesmo grupo para todas.
export const buildInstallments = ({
  amount,
  count,
  firstDate,
  groupId,
}: {
  amount: Prisma.Decimal | number | string;
  count: number;
  firstDate: Date;
  groupId: string;
}): InstallmentPlan[] =>
  splitIntoCents(amount, count).map((cents, index) => ({
    amount: new Prisma.Decimal(cents).dividedBy(100),
    current_installment: index + 1,
    total_installments: count,
    transaction_date: addMonthsClamped(firstDate, index),
    installment_group_id: groupId,
  }));
