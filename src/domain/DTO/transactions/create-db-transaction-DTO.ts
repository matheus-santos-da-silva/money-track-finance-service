import { CreateTransactionInput } from "./create-transaction-DTO";

// O que o repositório grava: a data já normalizada para Date (12:00 UTC do dia).
export interface CreateDBTransactionDTO
  extends Omit<CreateTransactionInput, "transaction_date"> {
  transaction_date?: Date;
  installment_group_id?: string;
  recurrence_series_id?: string;
}
