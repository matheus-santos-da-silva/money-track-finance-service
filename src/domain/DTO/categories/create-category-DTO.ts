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
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateCategoryDTO {
  @IsNotEmpty({ message: "O tipo é obrigatório!" })
  @IsEnum(TransactionType, {
    message: "Tipo inválido, o tipo deve ser EXPENSE ou INCOME",
  })
  type: CategoryType;

  @IsNotEmpty({ message: "O nome é obrigatório!" })
  @IsString({ message: "O nome deve ser uma string" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(CATEGORY_NAME_MIN_LENGTH, {
    message: `O nome deve ter pelo menos ${CATEGORY_NAME_MIN_LENGTH} caracteres!`,
  })
  @MaxLength(CATEGORY_NAME_MAX_LENGTH, {
    message: `O nome deve ter no máximo ${CATEGORY_NAME_MAX_LENGTH} caracteres!`,
  })
  name: string;

  @IsNotEmpty({ message: "O ícone é obrigatório!" })
  @IsString({ message: "O ícone deve ser uma string" })
  icon: string;

  @IsDateString()
  created_at: Date;
}
