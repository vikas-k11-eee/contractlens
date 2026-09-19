import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function unauthenticatedContext(): TrpcContext {
  return {
    user: undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("protected account surface", () => {
  it("rejects account reads without an OAuth session", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.auth.account()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects settings updates without an OAuth session", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(
      caller.settings.update({ renewalAlerts: false })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
