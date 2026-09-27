import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { getSupabaseUser } from "./supabase";

export type SessionPayload = { openId: string; appId: string; name: string };

export type AuthenticatedUser = User & { taskUid?: string; isCron?: boolean };

export async function authenticateSupabaseRequest(req: Request): Promise<AuthenticatedUser> {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  if (!token) {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const cookieToken = cookies["sb-access-token"];
    if (cookieToken) token = cookieToken;
  }

  if (!token) throw new Error("Missing Supabase access token");

  const authUser = await getSupabaseUser(token);
  if (!authUser) throw new Error("Invalid Supabase access token");

  const openId = authUser.id;
  const name =
    (authUser.user_metadata?.full_name as string | undefined) ??
    (authUser.user_metadata?.name as string | undefined) ??
    authUser.email?.split("@")[0] ??
    "Usuário";

  // The editorial owner record already exists in public.users and is protected by RLS.
  // Do not make the entire authentication flow depend on the optional server-only
  // service-role secret: an existing authenticated user can be loaded safely with
  // the user's own Bearer token. This is especially important on Cloudflare Worker
  // deployments where only the publishable Supabase key may be configured.
  const existingUser = await db.getUserByOpenId(openId, token);
  if (existingUser) {
    await db.upsertUser({
      openId,
      name,
      email: authUser.email ?? null,
      loginMethod: authUser.app_metadata?.provider ?? "supabase",
      lastSignedIn: new Date(),
    }, token);
    return (await db.getUserByOpenId(openId, token)) ?? existingUser;
  }

  // New-account provisioning still uses the server-side sync path. Existing users
  // never need the service-role key just to sign in and reach the editorial panel.
  await db.upsertUser({
    openId,
    name,
    email: authUser.email ?? null,
    loginMethod: authUser.app_metadata?.provider ?? "supabase",
    lastSignedIn: new Date(),
  }, token);

  const user = await db.getUserByOpenId(openId, token);
  if (!user) throw new Error("User not found after Supabase sync");
  return user;
}
