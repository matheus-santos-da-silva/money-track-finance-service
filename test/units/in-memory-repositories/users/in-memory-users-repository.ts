import { User } from "src/domain/entities/users/user";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";

export class InMemoryUsersRepository implements UsersRepositoryProtocol {
  users: User[] = [];

  async create(id: string): Promise<User> {
    this.users.push({ id });
    return { id };
  }

  async find(id: string): Promise<User> {
    const user = this.users.find((user) => user.id === id);
    return user;
  }
}
