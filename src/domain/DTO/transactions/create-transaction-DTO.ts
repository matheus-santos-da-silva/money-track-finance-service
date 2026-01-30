import { Prisma } from "@prisma/client";
import { Recurrence } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateTransactionDTO {
  @IsNotEmpty({ message: "O id do usuário é obrigatório!" })
  user_id: string;

  @IsNotEmpty({ message: "O valor é obrigatório!" })
  amount: Prisma.Decimal;

  @IsNotEmpty({ message: "O total de parcelas é obrigatório!" })
  total_installments: number;

  @IsNotEmpty({ message: "Parcela atual é obrigatória!" })
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
  description?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: "A data da transação deve ser uma data válida!" },
  )
  transaction_date?: Date;

  @IsOptional()
  @IsDateString({}, { message: "A data de criação deve ser uma data válida!" })
  created_at?: Date;
}
