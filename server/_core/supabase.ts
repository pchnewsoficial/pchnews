import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";

function requireSupabaseConfig() {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error("Supabase config missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
}

export function getSupabaseAdmin() {
  requireSupabaseConfig();
  return createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getSupabasePublic() {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
    throw new Error("Supabase public config missing: set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getSupabaseUser(accessToken: string) {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}
