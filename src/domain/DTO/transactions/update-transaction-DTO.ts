import { Prisma } from "@prisma/client";
import { Recurrence } from "@prisma/client";
import { MAX_INSTALLMENTS } from "src/shared/constants/transactions";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";

export class UpdateTransactionDTO {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: Prisma.Decimal | number;

  @IsOptional()
  @IsString({ message: "O Id da categoria precisa ser string!" })
  category_id?: string;

  @IsOptional()
  @IsString({ message: "A descrição precisa ser string!" })
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_INSTALLMENTS)
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
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "A data da transação deve estar no formato AAAA-MM-DD!",
  })
  transaction_date?: string | Date;

  @IsOptional()
  @IsBoolean()
  applyToAll?: boolean;
}
