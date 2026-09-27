import { supabase } from "@/lib/supabase";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

function getAdminRedirectUrl() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/admin`;
}

export const startLogin = async () => {
  const redirectTo = getAdminRedirectUrl();
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
