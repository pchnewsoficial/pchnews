import type { AuthAdapter, AuthResult, AuthUser } from "./types";

const STORAGE_KEY = "pch-news.session";

const DEMO_USERS: Array<AuthUser & { password: string }> = [
  {
    id: "u-1",
    name: "Helena Vasques",
    email: "redacao@pchnews.com.br",
    role: "admin",
    password: "pchnews123",
  },
  {
    id: "u-2",
    name: "Rafael Munhoz",
    email: "editor@pchnews.com.br",
    role: "editor",
    password: "pchnews123",
  },
];

function readStored(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeStored(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(STORAGE_KEY);
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const localAuthAdapter: AuthAdapter = {
  provider: "local",

  async getCurrentUser() {
    return readStored();
  },

  async signIn(email, password): Promise<AuthResult> {
    await delay(500);
    const match = DEMO_USERS.find(
      (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!match || match.password !== password) {
      return { user: null, error: "E-mail ou senha incorretos." };
    }
    const { password: _omit, ...user } = match;
    writeStored(user);
    return { user, error: null };
  },

  async signOut() {
    await delay(150);
    writeStored(null);
  },

  async updateProfile(patch): Promise<AuthResult> {
    await delay(400);
    const current = readStored();
    if (!current) return { user: null, error: "Sessão expirada. Entre novamente." };
    const user: AuthUser = { ...current, ...patch };
    writeStored(user);
    return { user, error: null };
  },
};

export const DEMO_CREDENTIALS = {
  email: DEMO_USERS[0].email,
  password: DEMO_USERS[0].password,
};
