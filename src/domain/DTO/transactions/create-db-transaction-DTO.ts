import { CreateTransactionDTO } from "./create-transaction-DTO";

export interface CreateDBTransactionDTO extends CreateTransactionDTO {
  installment_group_id?: string;
}
