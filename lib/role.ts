/**
 * Klarblick Role System
 *
 * Rollen:
 *   sw_admin   — Amin Sistek (System-Administrator, voller Zugriff)
 *   owner      — Firmeninhaber (voller Zugriff auf seine Firma)
 *   member     — Mitarbeiter (Belege erfassen & prüfen, kein Löschen, keine Settings)
 *   advisor    — Steuerberater (NUR LESEN + Export, keine Änderungen)
 *
 * In Demo/localStorage-Modus: Rolle aus klarblick.myRole gespeichert.
 * In Produktion: Supabase JWT custom claims + RLS-Policies.
 */

export type UserRole = "sw_admin" | "owner" | "member" | "advisor";

export interface RolePermissions {
  canEdit: boolean;        // Belege bearbeiten
  canDelete: boolean;      // Belege löschen
  canApprove: boolean;     // Status auf "geprüft" setzen
  canHandover: boolean;    // An Steuerberater übergeben
  canManageTeam: boolean;  // Team einladen/entfernen
  canSettings: boolean;    // Einstellungen ändern
  canExport: boolean;      // CSV/PDF exportieren
  isReadOnly: boolean;     // Globaler Lesemodus (Advisor)
}

const PERMISSIONS: Record<UserRole, RolePermissions> = {
  sw_admin: {
    canEdit: true, canDelete: true, canApprove: true, canHandover: true,
    canManageTeam: true, canSettings: true, canExport: true, isReadOnly: false,
  },
  owner: {
    canEdit: true, canDelete: true, canApprove: true, canHandover: true,
    canManageTeam: true, canSettings: true, canExport: true, isReadOnly: false,
  },
  member: {
    canEdit: true, canDelete: false, canApprove: true, canHandover: false,
    canManageTeam: false, canSettings: false, canExport: true, isReadOnly: false,
  },
  advisor: {
    canEdit: false, canDelete: false, canApprove: false, canHandover: false,
    canManageTeam: false, canSettings: false, canExport: true, isReadOnly: true,
  },
};

const ROLE_LABELS: Record<UserRole, string> = {
  sw_admin: "System-Admin",
  owner: "Inhaber",
  member: "Mitarbeiter",
  advisor: "Steuerberater (Leserechte)",
};

const ROLE_KEY = "klarblick.myRole";

// SW-Admin E-Mails (immer voller Zugriff)
const SW_ADMIN_EMAILS = ["amin.sistek20@gmail.com", "office@klarblick.at"];

export function loadRole(): UserRole {
  if (typeof window === "undefined") return "owner";
  // Prüfe ob E-Mail sw_admin
  try {
    const profile = JSON.parse(localStorage.getItem("klarblick.profile") || "{}");
    const userEmail = profile.email || "";
    if (SW_ADMIN_EMAILS.includes(userEmail)) return "sw_admin";
  } catch {}
  // Aus localStorage
  const stored = localStorage.getItem(ROLE_KEY) as UserRole | null;
  if (stored && stored in PERMISSIONS) return stored;
  return "owner"; // Default: Inhaber
}

export function saveRole(role: UserRole) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ROLE_KEY, role);
  }
}

export function getPermissions(role: UserRole): RolePermissions {
  return PERMISSIONS[role];
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

export function canPerform(role: UserRole, action: keyof RolePermissions): boolean {
  return !!PERMISSIONS[role][action];
}
