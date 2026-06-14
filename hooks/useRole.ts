"use client";

/**
 * useRole — Gibt die aktuelle Rolle + Berechtigungen des eingeloggten Users zurück.
 * Delegiert an AuthProvider (Supabase-basiert, kein localStorage-Hack mehr).
 */
import { useAuth } from "@/lib/auth-context";

export function useRole() {
  const { role, permissions, user, isLoading, companyOwnerId } = useAuth();
  return { role, permissions, user, isLoading, companyOwnerId };
}
