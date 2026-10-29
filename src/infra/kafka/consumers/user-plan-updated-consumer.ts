import { Plan } from "@prisma/client";
import { Controller } from "@nestjs/common";
import {
  Ctx,
  KafkaContext,
  MessagePattern,
  Payload,
} from "@nestjs/microservices";
import { observeMessage } from "../observe-message";
import { DeadLetterService } from "../dead-letter/dead-letter.service";
import { withRetryAndDlq } from "../dead-letter/with-retry-and-dlq";
import { UsersRepositoryProtocol } from "src/infra/database/repositories/users/protocols/users-repository-protocol";

interface UserPlanUpdatedPayload {
  id: string;
  plan: Plan;
}

@Controller()
export class UserPlanUpdatedConsumer {
  constructor(
    private readonly repository: UsersRepositoryProtocol,
    private readonly deadLetter: DeadLetterService,
  ) {}

  @MessagePattern("user-plan-updated")
  async execute(
    @Payload() message: UserPlanUpdatedPayload,
    @Ctx() context?: KafkaContext,
  ): Promise<void> {
    await observeMessage("user-plan-updated", context, () =>
      withRetryAndDlq({
        topic: "user-plan-updated",
        payload: message,
        deadLetter: this.deadLetter,
        // Upsert: funciona mesmo se este evento chegar antes de user-created.
        handler: () => this.repository.updatePlan(message.id, message.plan),
      }),
    );
  }
}
