"use client";

import Image from "next/image";
import { Quote, Star } from "lucide-react";

/* ──────────────────────────────────────────────────────────────
   PartnersStrip — Logo-Wall der „Vertrauen uns bereits"-Partner.
   Logos liegen in /public/partners/. Falls eine Datei fehlt,
   wird automatisch der Name als stilisierter Text-Fallback gezeigt.
   ────────────────────────────────────────────────────────────── */

const PARTNERS = [
  { name: "ETRA Elektrotechnik GmbH", logo: "/partners/etra.png", short: "ETRA" },
  { name: "Sistek", logo: "/partners/sistek.png", short: "SISTEK" },
  { name: "Zoran Lakic e.U.", logo: "/partners/zoran-lakic.png", short: "ZORAN LAKIC" },
];

export function PartnersStrip() {
  return (
    <section className="py-14 border-y border-border bg-white">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase mb-8">
          Vertrauen Klarblick bereits
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-8 items-center">
          {PARTNERS.map((p) => (
            <PartnerLogo key={p.name} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnerLogo({ name, logo, short }: { name: string; logo: string; short: string }) {
  return (
    <div
      className="group relative h-16 flex items-center justify-center grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition"
      title={name}
    >
      {/* Wenn Bild existiert wird es geladen, sonst Text-Fallback */}
      <img
        src={logo}
        alt={name}
        className="max-h-14 w-auto object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
          const sibling = (e.currentTarget.nextElementSibling as HTMLElement) || null;
          if (sibling) sibling.style.display = "block";
        }}
      />
      <span
        className="hidden text-slate-700 font-extrabold tracking-wider text-lg"
        aria-hidden="true"
      >
        {short}
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Testimonials — drei Stimmen von echten Branchen.
   ────────────────────────────────────────────────────────────── */

const TESTIMONIALS = [
  {
    quote:
      "Wir haben Belege früher monatlich an unseren Steuerberater geschickt — chaotisch. Mit Klarblick ist das Paket in 10 Minuten fertig und wir wissen sofort, wo unsere Kosten stehen.",
    author: "Erkan Demir",
    role: "Geschäftsführer",
    company: "ETRA Elektrotechnik GmbH",
    logo: "/partners/etra.png",
    short: "ETRA",
  },
  {
    quote:
      "Endlich verstehe ich meine Zahlen ohne Steuerberater-Übersetzung. Klarblick zeigt mir jeden Monat klar: was steigt, was sinkt, wo muss ich handeln.",
    author: "Tomislav Jurić",
    role: "Inhaber",
    company: "Sistek",
    logo: "/partners/sistek.png",
    short: "SISTEK",
  },
  {
    quote:
      "Auf der Baustelle Foto vom Materialbeleg — am Abend ist der Monatsreport aktuell. So einfach hätte ich es nie für möglich gehalten.",
    author: "Zoran Lakic",
    role: "Installateurmeister",
    company: "Zoran Lakic e.U.",
    logo: "/partners/zoran-lakic.png",
    short: "ZL",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 lg:py-24 bg-slate-50 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">
            Stimmen aus der Praxis
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Unternehmer, die endlich Klarblick haben.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <article key={t.author} className="card-soft p-6 flex flex-col">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <Quote className="h-6 w-6 text-brand-200 mt-4" />
              <p className="mt-3 text-slate-700 leading-relaxed flex-1">„{t.quote}"</p>
              <div className="mt-6 pt-5 border-t border-border flex items-center gap-3">
                <div className="h-11 w-11 rounded-lg bg-white border border-border grid place-content-center overflow-hidden shrink-0">
                  <img
                    src={t.logo}
                    alt={t.company}
                    className="max-h-8 max-w-8 object-contain"
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement;
                      el.style.display = "none";
                      const fb = el.nextElementSibling as HTMLElement | null;
                      if (fb) fb.style.display = "block";
                    }}
                  />
                  <span className="hidden text-[10px] font-extrabold text-slate-700">{t.short}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{t.author}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
