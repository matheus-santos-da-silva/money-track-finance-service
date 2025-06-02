import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";

interface UserCreatedPayload {
  id: string;
}

@Controller()
export class UserCreatedConsumer {
  constructor(private readonly repository: UsersRepositoryProtocol) {}

  @MessagePattern("user-created")
  async execute(@Payload() message: UserCreatedPayload): Promise<void> {
    try {
      await this.repository.create(message.id);
    } catch (error) {
      console.error("Erro ao criar usuário no Finance Service:", error);
      throw error instanceof Error ? error : new Error("Erro desconhecido");
    }
  }
}
