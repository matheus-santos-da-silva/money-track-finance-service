import { Prisma } from "@prisma/client";
import { Recurrence } from "@prisma/client";
import {
  DESCRIPTION_MAX_LENGTH,
  MAX_INSTALLMENTS,
} from "src/shared/constants/transactions";
import {
  MaxLength,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";

// Corpo da requisição. O dono não vem do cliente: o controller usa o usuário do token.
export class CreateTransactionDTO {
  @IsNotEmpty({ message: "O valor é obrigatório!" })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: "O valor deve ser um número com até 2 casas decimais!" },
  )
  @IsPositive({ message: "O valor deve ser maior que zero!" })
  amount: Prisma.Decimal;

  @IsNotEmpty({ message: "O total de parcelas é obrigatório!" })
  @IsInt({ message: "O total de parcelas deve ser um número inteiro!" })
  @Min(1, { message: "O total de parcelas deve ser no mínimo 1!" })
  @Max(MAX_INSTALLMENTS, {
    message: `O total de parcelas deve ser no máximo ${MAX_INSTALLMENTS}!`,
  })
  total_installments: number;

  @IsNotEmpty({ message: "Parcela atual é obrigatória!" })
  @IsInt({ message: "A parcela atual deve ser um número inteiro!" })
  @Min(1, { message: "A parcela atual deve ser no mínimo 1!" })
  @Max(MAX_INSTALLMENTS, {
    message: `A parcela atual deve ser no máximo ${MAX_INSTALLMENTS}!`,
  })
  current_installment: number;

  @IsNotEmpty({ message: "O id da categoria é obrigatório!" })
  category_id: string;

  @IsOptional()
  @IsEnum(Recurrence, {
    message: "A recorrência deve ser MONTHLY, YEARLY ou NONE",
  })
  recurrence?: Recurrence;

  @IsOptional()
  @IsString({ message: "A descrição deve ser uma string!" })
  @MaxLength(DESCRIPTION_MAX_LENGTH, {
    message: `A descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres!`,
  })
  description?: string;

  // Dia de calendário (AAAA-MM-DD). Date só é usado internamente/em testes.
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "A data da transação deve estar no formato AAAA-MM-DD!",
  })
  transaction_date?: string | Date;

  @IsOptional()
  @IsDateString({}, { message: "A data de criação deve ser uma data válida!" })
  created_at?: Date;
}

// Entrada dos use cases de criação: o corpo + o dono, já resolvido a partir do token.
export type CreateTransactionInput = CreateTransactionDTO & { user_id: string };
