import { Category } from "src/domain/entities/categories/category";

export type CategoryResponseDTO = Omit<
  Category,
  "id" | "user_id" | "type" | "created_at"
>;
