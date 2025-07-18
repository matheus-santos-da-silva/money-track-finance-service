import { CategoryType } from "@prisma/client";
import { TransactionType } from "./get-categories-query-DTO";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";

export class UpdateCategoryDTO {
  @IsOptional()
  @IsEnum(TransactionType, {
    message: "Tipo inválido, o tipo deve ser EXPENSE ou INCOME",
  })
  type?: CategoryType;

  @IsOptional()
  @IsString({ message: "O nome deve ser uma string" })
  name?: string;

  @IsOptional()
  @IsString({ message: "O ícone deve ser uma string" })
  icon?: string;

  @IsOptional()
  @IsDateString()
  created_at?: Date;
}
