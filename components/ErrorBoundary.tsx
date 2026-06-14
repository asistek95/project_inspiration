"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface State { hasError: boolean; error: Error | null; }

/**
 * Fängt unbehandelte React-Fehler ab und zeigt einen benutzerfreundlichen
 * Fallback statt eines leeren/weißen Bildschirms.
 * Logs werden in localStorage unter klarblick.errors gespeichert
 * und können unter Einstellungen exportiert werden.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In localStorage loggen für spätere Diagnose
    logError(error, info.componentStack || "");
    // In Produktion: Sentry.captureException(error)
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex items-center justify-center min-h-[200px] p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 grid place-content-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="font-bold text-slate-900">Etwas ist schiefgelaufen</h2>
            <p className="text-sm text-slate-500">
              {this.state.error?.message || "Unbekannter Fehler"}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="btn-secondary inline-flex"
            >
              <RefreshCw className="h-4 w-4" /> Seite neu laden
            </button>
            <p className="text-xs text-slate-400">
              Fehler wurde protokolliert. Bei wiederholtem Auftreten bitte Support kontaktieren.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Logging ──────────────────────────────────────────────────
const ERROR_KEY = "klarblick.errors";
const MAX_ERRORS = 50;

export interface ErrorLog {
  ts: string;
  message: string;
  stack?: string;
  component?: string;
  url?: string;
}

export function logError(error: Error, componentStack?: string) {
  if (typeof window === "undefined") return;
  try {
    const existing: ErrorLog[] = JSON.parse(localStorage.getItem(ERROR_KEY) || "[]");
    const entry: ErrorLog = {
      ts: new Date().toISOString(),
      message: error.message,
      stack: error.stack?.slice(0, 500),
      component: componentStack?.slice(0, 300),
      url: window.location.pathname,
    };
    existing.unshift(entry);
    localStorage.setItem(ERROR_KEY, JSON.stringify(existing.slice(0, MAX_ERRORS)));
  } catch {}
}

export function loadErrorLogs(): ErrorLog[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(ERROR_KEY) || "[]"); } catch { return []; }
}

export function clearErrorLogs() {
  if (typeof window !== "undefined") localStorage.removeItem(ERROR_KEY);
}
