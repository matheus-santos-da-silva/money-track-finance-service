import { Category } from "src/domain/entities/categories/category";

export type GetCategoryResponseDTO = Omit<Category, "type" | "created_at">;
