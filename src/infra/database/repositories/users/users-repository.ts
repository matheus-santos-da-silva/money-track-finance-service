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
    // Idempotente e independente da ordem: se o usuário já existe (reentrega, ou o evento de
    // plano chegou antes), só completa o trialEndsAt e NÃO sobrescreve o plano.
    return this.prisma.user.upsert({
      where: { id },
      create: { id, plan, trialEndsAt },
      update: { trialEndsAt },
    });
  }

  // Remove todos os dados do usuário. Idempotente: reprocessar o evento não falha.
  async delete(id: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.expense.deleteMany({ where: { user_id: id } }),
      this.prisma.income.deleteMany({ where: { user_id: id } }),
      this.prisma.recurringSeries.deleteMany({ where: { user_id: id } }),
      this.prisma.category.deleteMany({ where: { user_id: id } }),
      this.prisma.user.deleteMany({ where: { id } }),
    ]);
  }

  // Se o evento de plano chegar antes de user-created (tópicos diferentes não têm ordem
  // garantida), cria o usuário com trialEndsAt provisório; user-created preenche o valor real.
  async updatePlan(id: string, plan: Plan): Promise<void> {
    await this.prisma.user.upsert({
      where: { id },
      create: { id, plan, trialEndsAt: new Date(0) },
      update: { plan },
    });
  }
}
