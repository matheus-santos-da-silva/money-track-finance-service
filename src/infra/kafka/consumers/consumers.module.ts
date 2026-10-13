import { Module } from "@nestjs/common";
import { UserCreatedConsumer } from "./user-created-consumer";
import { UserDeletedConsumer } from "./user-deleted-consumer";
import { UserPlanUpdatedConsumer } from "./user-plan-updated-consumer";
import { DeadLetterService } from "../dead-letter/dead-letter.service";
import { UsersRepositoriesModule } from "src/infra/database/repositories/users/users-repositories.module";

@Module({
  imports: [UsersRepositoriesModule],
  providers: [DeadLetterService],
  controllers: [
    UserCreatedConsumer,
    UserPlanUpdatedConsumer,
    UserDeletedConsumer,
  ],
})
export class ConsumersModule {}
