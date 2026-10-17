import { Transform, Type } from "class-transformer";
import {
  StatementMode,
  StatementSort,
  StatementType,
} from "src/shared/transactions/statement";
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export const STATEMENT_DEFAULT_LIMIT = 30;
export const STATEMENT_MAX_LIMIT = 100;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// "a,b,c" na query string vira ["a", "b", "c"].
const toList = ({ value }: { value: unknown }) =>
  typeof value === "string"
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : value;

export class GetStatementQueryDTO {
  @Matches(DATE_ONLY, { message: "start_date deve estar no formato AAAA-MM-DD." })
  start_date: string;

  @Matches(DATE_ONLY, { message: "end_date deve estar no formato AAAA-MM-DD." })
  end_date: string;

  @IsOptional()
  @IsEnum(StatementType, { message: "type deve ser EXPENSE ou INCOME." })
  type?: StatementType;

  @IsOptional()
  @Transform(toList)
  @IsArray()
  @ArrayMaxSize(50, { message: "Selecione no máximo 50 categorias." })
  @IsString({ each: true })
  category_ids?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: "min_amount deve ser um valor em reais." },
  )
  @Min(0, { message: "min_amount não pode ser negativo." })
  min_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: "max_amount deve ser um valor em reais." },
  )
  @Min(0, { message: "max_amount não pode ser negativo." })
  max_amount?: number;

  @IsOptional()
  @Transform(toList)
  @IsArray()
  @IsEnum(StatementMode, {
    each: true,
    message: "modes aceita SINGLE, INSTALLMENT e RECURRING.",
  })
  modes?: StatementMode[];

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "A busca deve ter no máximo 100 caracteres." })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  search?: string;

  @IsOptional()
  @IsEnum(StatementSort, { message: "Ordenação inválida." })
  sort?: StatementSort = StatementSort.DATE_DESC;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "limit deve ser um número inteiro." })
  @Min(1, { message: "limit deve ser no mínimo 1." })
  @Max(STATEMENT_MAX_LIMIT, {
    message: `limit deve ser no máximo ${STATEMENT_MAX_LIMIT}.`,
  })
  limit?: number = STATEMENT_DEFAULT_LIMIT;

  @IsOptional()
  @IsString()
  cursor?: string;
}
