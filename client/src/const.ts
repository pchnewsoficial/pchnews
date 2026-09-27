import { supabase } from "@/lib/supabase";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const PRODUCTION_ADMIN_ORIGIN = "https://pch-news.pchnews-oficial.workers.dev";

export const startLogin = async () => {
  const redirectTo = PRODUCTION_ADMIN_ORIGIN + "/admin";
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
