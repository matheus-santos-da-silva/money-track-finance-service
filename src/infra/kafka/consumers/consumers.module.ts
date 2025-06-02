import { Module } from "@nestjs/common";
import { UserCreatedConsumer } from "./user-created-consumer";
import { UsersRepositoriesModule } from "src/infra/database/repositories/users/users-repositories.module";

@Module({
  imports: [UsersRepositoriesModule],
  controllers: [UserCreatedConsumer],
})
export class ConsumersModule {}
