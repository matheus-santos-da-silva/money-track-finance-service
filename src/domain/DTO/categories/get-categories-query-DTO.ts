import { IsEnum, IsOptional } from "class-validator";

export enum TransactionType {
  EXPENSE = "EXPENSE",
  INCOME = "INCOME",
}

export class GetCategoriesQueryDTO {
  @IsOptional()
  @IsEnum(TransactionType, {
    message: "Tipo inválido, o tipo deve ser EXPENSE ou INCOME",
  })
  type?: TransactionType;
}
