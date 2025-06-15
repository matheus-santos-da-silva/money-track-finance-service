import { UpdateTransactionDTO } from "../transactions/update-transaction-DTO";

export interface UpdateIncomeDTO {
  id: string;
  user_id: string;
  data: UpdateTransactionDTO;
}
