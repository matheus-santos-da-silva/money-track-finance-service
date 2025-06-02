import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { UsersRepository } from "./users-repository";
import { UsersRepositoryProtocol } from "./protocols/users-repository-protocol";

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: UsersRepositoryProtocol,
      useClass: UsersRepository,
    },
  ],
  exports: [UsersRepositoryProtocol],
})
export class UsersRepositoriesModule {}
