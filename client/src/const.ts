import { supabase } from "@/lib/supabase";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const startLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    // Let Supabase use the project's configured Site URL instead of requiring
    // every Lovable/preview hostname to be present in the redirect allow-list.
  });
  if (error) {
    console.error("[Supabase Auth] Login failed:", error);
    return error;
  }
  return null;
};
