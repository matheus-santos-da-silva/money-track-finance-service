import { CategoryType } from "@prisma/client";
import { TransactionType } from "./get-categories-query-DTO";
import { IsDateString, IsEnum, IsNotEmpty, IsString } from "class-validator";

export class CreateCategoryDTO {
  @IsNotEmpty({ message: "O tipo é obrigatório!" })
  @IsEnum(TransactionType, {
    message: "Tipo inválido, o tipo deve ser EXPENSE ou INCOME",
  })
  type: CategoryType;

  @IsNotEmpty({ message: "O nome é obrigatório!" })
  @IsString({ message: "O nome deve ser uma string" })
  name: string;

  @IsNotEmpty({ message: "O ícone é obrigatório!" })
  @IsString({ message: "O ícone deve ser uma string" })
  icon: string;

  @IsDateString()
  created_at: Date;
}
