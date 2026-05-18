/**
 * Session-Cookie für die Klarblick-Middleware.
 * Wird nach Login/Register gesetzt, beim Logout gelöscht.
 * Die eigentliche Auth-Sicherheit kommt aus Supabase (Session-Token + RLS) —
 * dieses Cookie ist nur der serverseitige "Türsteher", der unangemeldete
 * Besucher früh auf /login schickt.
 */

const NAME = "klarblick_session";
const ADMIN_NAME = "klarblick_admin_email";

export function setSessionCookie(email: string) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 30; // 30 Tage
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${NAME}=${encodeURIComponent(email)}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
  document.cookie = `${ADMIN_NAME}=${encodeURIComponent(email)}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
}

export function clearSessionCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${NAME}=; path=/; max-age=0; samesite=lax`;
  document.cookie = `${ADMIN_NAME}=; path=/; max-age=0; samesite=lax`;
}
