import { UpdateTransactionDTO } from "../transactions/update-transaction-DTO";

export interface UpdateExpenseDTO {
  id: string;
  user_id: string;
  data: UpdateTransactionDTO;
}
