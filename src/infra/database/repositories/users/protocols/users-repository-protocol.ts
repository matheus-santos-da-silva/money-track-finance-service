import { User } from "src/domain/entities/users/user";

export abstract class UsersRepositoryProtocol {
  abstract create(id: string): Promise<User>;
}
