import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Integration test: needs a real Supabase service-role configuration.
// CI runs without production secrets, so skip instead of failing the build.
const hasSupabaseAdmin = Boolean(
  process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
);

describe("editorial.bootstrap", () => {
  it.skipIf(!hasSupabaseAdmin)("returns the persisted editorial collections", async () => {
    const ctx = { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
    const result = await appRouter.createCaller(ctx).editorial.bootstrap();
    expect(result).toHaveProperty("articles");
    expect(result).toHaveProperty("comments");
    expect(result).toHaveProperty("profiles");
    expect(result).toHaveProperty("adRequests");
    expect(Array.isArray(result.articles)).toBe(true);
  });
});
