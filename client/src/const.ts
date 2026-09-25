import { supabase } from "@/lib/supabase";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const startLogin = async () => {
  const redirectTo = typeof window !== "undefined" ? window.location.origin + "/?admin=1" : undefined;
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
