import { Plan } from "@prisma/client";
import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";

interface UserPlanUpdatedPayload {
  id: string;
  plan: Plan;
}

@Controller()
export class UserPlanUpdatedConsumer {
  constructor(private readonly repository: UsersRepositoryProtocol) {}

  @MessagePattern("user-plan-updated")
  async execute(@Payload() message: UserPlanUpdatedPayload): Promise<void> {
    try {
      await this.repository.updatePlan(message.id, message.plan);
    } catch (error) {
      console.error(
        "Erro ao atualizar plano do usuário no Finance Service:",
        error,
      );
      throw error instanceof Error ? error : new Error("Erro desconhecido");
    }
  }
}
