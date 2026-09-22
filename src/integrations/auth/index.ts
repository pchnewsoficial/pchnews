import { localAuthAdapter } from "./local-adapter";
import type { AuthAdapter } from "./types";

/**
 * Ponto único de troca do provedor de autenticação.
 * Ao conectar o Supabase Auth, substitua por `supabaseAuthAdapter`.
 */
export const authAdapter: AuthAdapter = localAuthAdapter;

export { DEMO_CREDENTIALS } from "./local-adapter";
export type { AuthAdapter, AuthUser, AuthResult, UserRole } from "./types";
