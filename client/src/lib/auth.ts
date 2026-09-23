export const AUTH_STORAGE_KEY = "pch-news-admin-auth";

export const DEMO_CREDENTIALS = {
  email: "pchnews.oficial@gmail.com",
  password: "123456",
};

export function isAuthenticated() {
  return typeof window !== "undefined" && window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";
}

const PASSWORD_STORAGE_KEY = "pch-news-admin-password";

export function signIn(email: string, password: string) {
  const currentPassword = typeof window !== "undefined" ? window.localStorage.getItem(PASSWORD_STORAGE_KEY) || DEMO_CREDENTIALS.password : DEMO_CREDENTIALS.password;
  const valid = email.trim().toLowerCase() === DEMO_CREDENTIALS.email && password === currentPassword;
  if (valid && typeof window !== "undefined") window.localStorage.setItem(AUTH_STORAGE_KEY, "true");
  return valid;
}

export function signOut() {
  if (typeof window !== "undefined") window.localStorage.removeItem(AUTH_STORAGE_KEY);
}


export function changePassword(currentPassword: string, newPassword: string) {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem(PASSWORD_STORAGE_KEY) || DEMO_CREDENTIALS.password;
  if (currentPassword !== stored || newPassword.trim().length < 6) return false;
  window.localStorage.setItem(PASSWORD_STORAGE_KEY, newPassword.trim());
  return true;
}
