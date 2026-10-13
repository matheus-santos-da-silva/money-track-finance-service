import { Plan } from "@prisma/client";
import { User } from "src/domain/entities/users/user";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";

export class InMemoryUsersRepository implements UsersRepositoryProtocol {
  users: User[] = [];

  async create(id: string, plan: Plan, trialEndsAt: Date): Promise<User> {
    const existing = this.users.find((user) => user.id === id);
    if (existing) {
      existing.trialEndsAt = trialEndsAt;
      return existing;
    }

    const user = { id, plan, trialEndsAt };
    this.users.push(user);
    return user;
  }

  async find(id: string): Promise<User> {
    const user = this.users.find((user) => user.id === id);
    return user;
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter((user) => user.id !== id);
  }

  async updatePlan(id: string, plan: Plan): Promise<void> {
    const user = this.users.find((user) => user.id === id);
    if (user) user.plan = plan;
    else this.users.push({ id, plan, trialEndsAt: new Date(0) });
  }
}
