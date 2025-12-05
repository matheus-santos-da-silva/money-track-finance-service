export interface DeleteExpenseDTO {
  id: string;
  user_id: string;
  applyToAll?: boolean;
}