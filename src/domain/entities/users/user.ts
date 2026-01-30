import { Plan } from "@prisma/client";

export class User {
  id: string;
  plan: Plan;
  trialEndsAt: Date;
}
