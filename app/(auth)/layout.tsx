"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { TenantConfig } from "@/lib/tenant";
import { DEFAULT_TENANT, persistTenantSlug } from "@/lib/tenant";

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const tenantSlug = params.get("tenant") || params.get("kanzlei");
  const [tenant, setTenant] = useState<TenantConfig>(DEFAULT_TENANT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!tenantSlug) { setLoaded(true); return; }
    persistTenantSlug(tenantSlug);
    fetch(`/api/tenant/${tenantSlug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((cfg) => {
        if (cfg) setTenant(cfg);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [tenantSlug]);

  const isCustomTenant = tenantSlug && tenant.slug !== "klarblick";
  const primaryColor = tenant.primaryColor || "#1a56db";

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — Branding */}
      <div
        className="hidden lg:flex flex-col justify-between p-10 text-white"
        style={{
          background: isCustomTenant
            ? `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`
            : "linear-gradient(135deg, #1a56db 0%, #1e3a8a 100%)",
        }}
      >
        {/* Logo + Name */}
        <div className="flex items-center gap-3">
          {tenant.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-12 w-auto max-w-[180px] object-contain"
              style={{ filter: isCustomTenant ? "none" : "brightness(10)" }}
            />
          ) : (
            <div className="h-11 w-11 rounded-xl bg-white/20 grid place-content-center text-xl font-black">
              {tenant.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          {!isCustomTenant && (
            <span className="font-bold text-xl">Klarblick</span>
          )}
          {isCustomTenant && (
            <span className="font-bold text-xl leading-tight">{tenant.name}</span>
          )}
        </div>

        {/* Headline + Text */}
        <div>
          <p className="text-3xl font-extrabold leading-tight max-w-md">
            {tenant.welcomeHeadline || DEFAULT_TENANT.welcomeHeadline}
          </p>
          <p className="mt-4 text-white/80 max-w-md text-sm leading-relaxed">
            {tenant.welcomeText || DEFAULT_TENANT.welcomeText}
          </p>

          {/* Kanzlei-Kontakt */}
          {isCustomTenant && tenant.contactEmail && (
            <div className="mt-6 rounded-xl bg-white/10 px-4 py-3 text-sm">
              <p className="font-semibold text-white/90">Fragen?</p>
              <a href={`mailto:${tenant.contactEmail}`} className="text-white/70 hover:text-white underline text-xs mt-0.5 block">
                {tenant.contactEmail}
              </a>
            </div>
          )}

          {/* Powered by Klarblick — nur wenn White Label */}
          {isCustomTenant && (
            <p className="mt-6 text-white/40 text-[11px]">
              Powered by{" "}
              <Link href="/" className="hover:text-white/70">
                Klarblick
              </Link>
            </p>
          )}
        </div>

        <p className="text-xs text-white/50">
          {tenant.footerText || "Klarblick ersetzt keine Steuerberatung. Erkannte Daten müssen geprüft werden."}
        </p>
      </div>

      {/* Right panel — Form */}
      <div className="flex items-center justify-center p-6 lg:p-10 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="h-9 w-auto max-w-[140px] object-contain" />
            ) : (
              <img src="/klar.png" alt="Klarblick" className="h-9 w-9 object-contain" />
            )}
            <span className="font-bold text-lg">{isCustomTenant ? tenant.name : "Klarblick"}</span>
          </div>

          {children}

          {/* Tenant-Pass-through in Links */}
          {isCustomTenant && loaded && (
            <p className="mt-4 text-[11px] text-slate-400 text-center">
              Dieses Portal wird bereitgestellt von {tenant.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen grid lg:grid-cols-2">
        <div className="hidden lg:block bg-gradient-to-br from-brand-600 to-brand-900" />
        <div className="flex items-center justify-center p-10 bg-white">
          <div className="w-full max-w-md animate-pulse space-y-4">
            <div className="h-8 bg-slate-100 rounded-lg w-2/3" />
            <div className="h-4 bg-slate-50 rounded w-full" />
          </div>
        </div>
      </div>
    }>
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </Suspense>
  );
}
