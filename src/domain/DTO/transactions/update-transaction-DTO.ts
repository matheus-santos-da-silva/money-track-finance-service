import { Recurrence } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class UpdateTransactionDTO {
  @IsOptional()
  @IsNumber()
  amount?: Decimal | number;

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
  @IsString({ message: "A recorrência precisa ser string!" })
  recurrence?: Recurrence;

  @IsOptional()
  @IsDateString()
  transaction_date?: Date;

  @IsOptional()
  @IsBoolean()
  applyToAll?: boolean;
}
