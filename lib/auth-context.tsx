"use client";

/**
 * AuthProvider — zentrales Rollensystem für Klarblick.
 *
 * Liefert { user, role, permissions, companyOwnerId } an die gesamte App.
 * Rolle wird nach Login aus Supabase geladen:
 *   1. sw_admin  → feste E-Mail-Liste
 *   2. owner     → hat eigenes Profile-Eintrag
 *   3. member / advisor → in team_members eingetragen
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase";
import {
  getPermissions,
  loadRole,
  type RolePermissions,
  type UserRole,
} from "@/lib/role";

const SW_ADMIN_EMAILS = ["amin.sistek20@gmail.com", "office@klarblick.at"];

// ── Typen ─────────────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  role: UserRole;
  permissions: RolePermissions;
  /** user_id des Firmeninhabers — bei Advisor/Member != user.id */
  companyOwnerId: string | null;
  isLoading: boolean;
}

export interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthCtx = createContext<AuthContextValue | null>(null);

// ── Rolle aus Supabase ermitteln ──────────────────────────────────────────────

async function resolveRole(
  user: User
): Promise<{ role: UserRole; companyOwnerId: string | null }> {
  if (SW_ADMIN_EMAILS.includes(user.email ?? "")) {
    return { role: "sw_admin", companyOwnerId: user.id };
  }

  const sb = getSupabaseBrowser();
  if (!sb) {
    // Offline/Demo — Rolle aus localStorage
    return { role: loadRole(), companyOwnerId: null };
  }

  try {
    // Eigenes Profil vorhanden? → Inhaber
    const { data: profile } = await sb
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      return { role: "owner", companyOwnerId: user.id };
    }

    // Als Team-Mitglied eingeladen?
    const { data: membership } = await sb
      .from("team_members")
      .select("role, company_id")
      .eq("member_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (membership) {
      return {
        role: membership.role as UserRole,
        companyOwnerId: membership.company_id as string,
      };
    }
  } catch {
    // Netzwerkfehler → sicher auf owner fallen
  }

  return { role: "owner", companyOwnerId: user.id };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: "owner",
    permissions: getPermissions("owner"),
    companyOwnerId: null,
    isLoading: true,
  });

  const userRef = useRef<User | null>(null);

  const applyUser = useCallback(async (user: User | null) => {
    userRef.current = user;
    if (!user) {
      setState({
        user: null,
        role: "owner",
        permissions: getPermissions("owner"),
        companyOwnerId: null,
        isLoading: false,
      });
      return;
    }
    const { role, companyOwnerId } = await resolveRole(user);
    setState({
      user,
      role,
      permissions: getPermissions(role),
      companyOwnerId,
      isLoading: false,
    });
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabaseBrowser();
    await sb?.auth.signOut();
    // Session-Cookie löschen
    if (typeof document !== "undefined") {
      document.cookie = "klarblick_session=; path=/; max-age=0; samesite=lax";
    }
  }, []);

  const refreshRole = useCallback(async () => {
    if (userRef.current) await applyUser(userRef.current);
  }, [applyUser]);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    // Initiale Session laden
    sb.auth.getSession().then(({ data }) => {
      applyUser(data.session?.user ?? null);
    });

    // Auth-Änderungen beobachten (Login, Logout, Token-Refresh)
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [applyUser]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, signOut, refreshRole }),
    [state, signOut, refreshRole]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth muss innerhalb von AuthProvider verwendet werden");
  return ctx;
}
