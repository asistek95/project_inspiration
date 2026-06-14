"use client";

import { Eye, Download } from "lucide-react";
import Link from "next/link";
import { useRole } from "@/hooks/useRole";

/**
 * Zeigt ein Banner wenn der aktuelle User Leserechte hat (advisor).
 * Platzierung: in AppShell direkt über dem main-Content.
 */
export function ReadOnlyBanner() {
  const { permissions, role } = useRole();
  if (!permissions.isReadOnly) return null;

  return (
    <div className="bg-slate-900 text-white text-xs px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Eye className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span>
          <strong>Steuerberater-Modus</strong> — Nur Lesen. Keine Änderungen an Belegen möglich.
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/report" className="flex items-center gap-1 text-slate-300 hover:text-white underline">
          <Download className="h-3 w-3" /> Export
        </Link>
        <Link href="/uva" className="text-slate-300 hover:text-white underline">UVA</Link>
      </div>
    </div>
  );
}
