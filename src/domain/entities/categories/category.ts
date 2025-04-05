import { CategoryType } from "@prisma/client";

interface CategoryProps {
  user_id?: string;
  type: CategoryType;
  name: string;
  icon?: string;
}

export class Category {
  id: string;
  user_id?: string;
  type: CategoryType;
  name: string;
  icon?: string;
  created_at: Date;

  constructor({ user_id, name, type, icon }: CategoryProps) {
    this.user_id = user_id;
    this.name = name;
    this.type = type;
    this.icon = icon;
  }
}
