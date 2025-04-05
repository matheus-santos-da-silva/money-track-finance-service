import { Recurrence } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { IsNotEmpty } from "class-validator";

export class CreateFinancialEntryDTO {
  @IsNotEmpty({ message: "O id do usuário é obrigatório!" })
  user_id: string;

  @IsNotEmpty({ message: "O valor é obrigatório!" })
  amount: Decimal;

  @IsNotEmpty({ message: "O total de parcelas é obrigatório!" })
  total_installments: number;

  @IsNotEmpty({ message: "O id da categoria é obrigatório!" })
  category_id: string;

  recurrence?: Recurrence;
  description?: string;
  transaction_date?: Date;
}
