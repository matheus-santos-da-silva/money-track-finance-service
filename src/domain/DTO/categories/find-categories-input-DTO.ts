import { TransactionType } from "./get-categories-query-DTO";

export interface FindCategoriesInputDTO {
  user_id: string;
  type?: TransactionType;
}
