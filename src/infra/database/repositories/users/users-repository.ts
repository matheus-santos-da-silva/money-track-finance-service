import { User } from "src/domain/entities/users/user";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { UsersRepositoryProtocol } from "./protocols/users-repository-protocol";

@Injectable()
export class UsersRepository implements UsersRepositoryProtocol {
  constructor(private readonly prisma: PrismaService) {}

  async create(id: string): Promise<User> {
    const user = this.prisma.user.create({ data: { id } });
    return user;
  }
}
