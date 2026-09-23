import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("editorial.bootstrap", () => {
  it("returns the persisted editorial collections", async () => {
    const ctx = { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
    const result = await appRouter.createCaller(ctx).editorial.bootstrap();
    expect(result).toHaveProperty("articles");
    expect(result).toHaveProperty("comments");
    expect(result).toHaveProperty("profiles");
    expect(result).toHaveProperty("adRequests");
    expect(Array.isArray(result.articles)).toBe(true);
  });
});
