/**
 * Contrato de autenticação do PCH News.
 *
 * A aplicação nunca fala diretamente com um provedor: ela conversa com este
 * contrato. Hoje existe um adaptador local (`localAuthAdapter`) usado com os
 * dados de exemplo. Para ligar o Supabase Auth basta criar
 * `src/integrations/auth/supabase-adapter.ts` implementando `AuthAdapter` e
 * trocar a exportação em `src/integrations/auth/index.ts` — nenhuma tela muda.
 */

export type UserRole = "admin" | "editor" | "colunista";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResult {
  user: AuthUser | null;
  error: string | null;
}

export interface AuthAdapter {
  /** Nome do provedor, exibido apenas em telas internas. */
  readonly provider: string;
  getCurrentUser(): Promise<AuthUser | null>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  updateProfile(patch: Partial<Pick<AuthUser, "name" | "email">>): Promise<AuthResult>;
}
