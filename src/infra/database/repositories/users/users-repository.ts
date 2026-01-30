import { Plan } from "@prisma/client";
import { User } from "src/domain/entities/users/user";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { UsersRepositoryProtocol } from "./protocols/users-repository-protocol";

@Injectable()
export class UsersRepository implements UsersRepositoryProtocol {
  constructor(private readonly prisma: PrismaService) {}

  async find(id: string): Promise<User> {
    const user = this.prisma.user.findUnique({ where: { id } });
    return user;
  }

  async create(id: string, plan: Plan, trialEndsAt: Date): Promise<User> {
    const user = this.prisma.user.create({ data: { id, plan, trialEndsAt } });
    return user;
  }
}
