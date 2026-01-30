import { Plan } from "@prisma/client";
import { User } from "src/domain/entities/users/user";

export abstract class UsersRepositoryProtocol {
  abstract create(id: string, plan: Plan, trialEndsAt: Date): Promise<User>;
  abstract find(id: string): Promise<User>;
}
