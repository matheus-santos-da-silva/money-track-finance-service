import { Module } from "@nestjs/common";
import { UserCreatedConsumer } from "./user-created-consumer";
import { UserPlanUpdatedConsumer } from "./user-plan-updated-consumer";
import { UsersRepositoriesModule } from "src/infra/database/repositories/users/users-repositories.module";

@Module({
  imports: [UsersRepositoriesModule],
  controllers: [UserCreatedConsumer, UserPlanUpdatedConsumer],
})
export class ConsumersModule {}
