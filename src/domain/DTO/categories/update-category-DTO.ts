import { CategoryType } from "@prisma/client";
import { Transform } from "class-transformer";
import { TransactionType } from "./get-categories-query-DTO";
import {
  CATEGORY_NAME_MAX_LENGTH,
  CATEGORY_NAME_MIN_LENGTH,
} from "src/shared/constants/transactions";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateCategoryDTO {
  @IsOptional()
  @IsEnum(TransactionType, {
    message: "Tipo inválido, o tipo deve ser EXPENSE ou INCOME",
  })
  type?: CategoryType;

  @IsOptional()
  @IsString({ message: "O nome deve ser uma string" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(CATEGORY_NAME_MIN_LENGTH, {
    message: `O nome deve ter pelo menos ${CATEGORY_NAME_MIN_LENGTH} caracteres!`,
  })
  @MaxLength(CATEGORY_NAME_MAX_LENGTH, {
    message: `O nome deve ter no máximo ${CATEGORY_NAME_MAX_LENGTH} caracteres!`,
  })
  name?: string;

  @IsOptional()
  @IsString({ message: "O ícone deve ser uma string" })
  icon?: string;

  @IsOptional()
  @IsDateString()
  created_at?: Date;
}
