import { Plan } from "@prisma/client";
import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { DeadLetterService } from "../dead-letter/dead-letter.service";
import { withRetryAndDlq } from "../dead-letter/with-retry-and-dlq";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";

interface UserCreatedPayload {
  id: string;
  plan: Plan;
  trialEndsAt: Date;
}

@Controller()
export class UserCreatedConsumer {
  constructor(
    private readonly repository: UsersRepositoryProtocol,
    private readonly deadLetter: DeadLetterService,
  ) {}

  @MessagePattern("user-created")
  async execute(@Payload() message: UserCreatedPayload): Promise<void> {
    await withRetryAndDlq({
      topic: "user-created",
      payload: message,
      deadLetter: this.deadLetter,
      // create é idempotente (upsert): reentregas não geram erro nem sobrescrevem o plano.
      handler: async () => {
        await this.repository.create(
          message.id,
          message.plan,
          message.trialEndsAt,
        );
      },
    });
  }
}
