import { Prisma } from "@prisma/client";
import { Recurrence } from "@prisma/client";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class UpdateTransactionDTO {
  @IsOptional()
  @IsNumber()
  amount?: Prisma.Decimal | number;

  @IsOptional()
  @IsString({ message: "O Id da categoria precisa ser string!" })
  category_id?: string;

  @IsOptional()
  @IsString({ message: "A descrição precisa ser string!" })
  description?: string;

  @IsOptional()
  @IsNumber()
  total_installments?: number;

  @IsOptional()
  @IsString()
  installment_group_id?: string;

  @IsOptional()
  @IsEnum(Recurrence, {
    message: "A recorrência deve ser MONTHLY, YEARLY ou NONE",
  })
  recurrence?: Recurrence;

  @IsOptional()
  @IsDateString()
  transaction_date?: Date;

  @IsOptional()
  @IsBoolean()
  applyToAll?: boolean;
}
