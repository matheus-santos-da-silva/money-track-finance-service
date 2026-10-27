import { HealthCheckService } from "@nestjs/terminus";
import { HealthController } from "src/presentation/controllers/health/health.controller";

describe("HealthController", () => {
  const setup = () => {
    const health = { check: jest.fn((checks) => Promise.all(checks.map((c) => c()))) };
    const prismaHealth = { pingCheck: jest.fn().mockResolvedValue({ database: { status: "up" } }) };
    const controller = new HealthController(
      health as unknown as HealthCheckService,
      prismaHealth as never,
      {} as never,
    );
    return { controller, health, prismaHealth };
  };

  it("should answer live without touching the database", () => {
    const { controller, prismaHealth } = setup();

    expect(controller.live()).toEqual({ status: "ok" });
    expect(prismaHealth.pingCheck).not.toHaveBeenCalled();
  });

  it("should check only the database when ready", async () => {
    const { controller, health, prismaHealth } = setup();

    await controller.ready();

    expect(health.check.mock.calls[0][0]).toHaveLength(1);
    expect(prismaHealth.pingCheck).toHaveBeenCalledWith(
      "database",
      expect.anything(),
      { timeout: 1500 },
    );
  });
});
