import { Category } from "src/domain/entities/categories/category";

export type GetCategoryResponseDTO = Omit<
  Category,
  "user_id" | "type" | "created_at"
>;
