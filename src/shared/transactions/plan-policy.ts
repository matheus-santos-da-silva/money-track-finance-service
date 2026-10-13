import { Plan } from "@prisma/client";
import { ForbiddenException } from "@nestjs/common";

interface PlanHolder {
  plan: Plan;
  trialEndsAt: Date;
}

// Regra única de acesso: Premium, ou trial ainda ativo (FREE com trialEndsAt no futuro).
// TRIAL (hoje não usado pelo users-service) também conta como acesso completo.
export const hasPremiumAccess = (user: PlanHolder, now = new Date()): boolean =>
  user.plan === "PREMIUM" ||
  user.plan === "TRIAL" ||
  (user.plan === "FREE" && user.trialEndsAt >= now);

// Plano gratuito com trial vencido é somente leitura (e pode excluir): criar e editar
// passam por aqui.
export const assertCanWrite = (user: PlanHolder, action: string): void => {
  if (!hasPremiumAccess(user)) {
    throw new ForbiddenException(
      `Não é possível ${action} para um usuário com plano gratuito.`,
    );
  }
};
