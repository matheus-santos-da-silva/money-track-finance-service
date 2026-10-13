import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { DeadLetterService } from "../dead-letter/dead-letter.service";
import { withRetryAndDlq } from "../dead-letter/with-retry-and-dlq";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";

interface UserDeletedPayload {
  id: string;
}

@Controller()
export class UserDeletedConsumer {
  constructor(
    private readonly repository: UsersRepositoryProtocol,
    private readonly deadLetter: DeadLetterService,
  ) {}

  @MessagePattern("user-deleted")
  async execute(@Payload() message: UserDeletedPayload): Promise<void> {
    await withRetryAndDlq({
      topic: "user-deleted",
      payload: message,
      deadLetter: this.deadLetter,
      handler: () => this.repository.delete(message.id),
    });
  }
}
