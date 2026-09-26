import { supabase } from "@/lib/supabase";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const ADMIN_APP_ORIGIN = "https://pch-news.pchnews-oficial.workers.dev";

export const startLogin = async () => {
  const redirectTo = typeof window !== "undefined" ? ADMIN_APP_ORIGIN + "/admin" : undefined;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: redirectTo ? { redirectTo } : undefined,
  });
  if (error) {
    console.error("[Supabase Auth] Login failed:", error);
    return error;
  }
  return null;
};
