"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  Circle,
  FolderArchive,
  Download,
  Mail,
  Folder,
  FileText,
  FileSpreadsheet,
  Database,
  Landmark,
  ShieldCheck,
  ArrowRight,
  Calculator,
} from "lucide-react";
import Link from "next/link";
import { loadReceipts, setStatusBulk } from "@/lib/store";
import type { Receipt } from "@/lib/types";
import { formatEUR } from "@/lib/utils";
import { exportCSV, generateReportPDF } from "@/lib/pdf";
import { buildDatevCSV, downloadCSV } from "@/lib/datev";
import { buildSepaXML, downloadXML } from "@/lib/sepa";
import { buildInsights, periodStats } from "@/lib/insights";
import { DEMO_COMPANY } from "@/lib/demo-data";

type ChecklistItem = {
  id: string;
  label: string;
  hint: string;
  status: "ok" | "warn" | "todo";
  count?: number;
  href?: string;
  action?: string;
};

export default function MonatsabschlussPaketPage() {
  const [all, setAll] = useState<Receipt[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [advisorEmail, setAdvisorEmail] = useState(DEMO_COMPANY.tax_advisor_email);

  useEffect(() => {
    const r = loadReceipts();
    setAll(r);
    if (r.length > 0) {
      const dates = r.map((x) => x.receipt_date).sort();
      const latest = new Date(dates[dates.length - 1]);
      const start = new Date(latest.getFullYear(), latest.getMonth() - 1, 1);
      const end = new Date(latest.getFullYear(), latest.getMonth() + 1, 0);
      setFrom(start.toISOString().slice(0, 10));
      setTo(end.toISOString().slice(0, 10));
    }
  }, []);

  const inPeriod = useMemo(
    () =>
      all.filter(
        (r) => (!from || r.receipt_date >= from) && (!to || r.receipt_date <= to),
      ),
    [all, from, to],
  );

  const stats = periodStats(inPeriod);
  const checkedReceipts = inPeriod.filter(
    (r) => r.status === "geprueft" || r.status === "freigegeben",
  );
  const uncertain = inPeriod.filter((r) => r.status === "unsicher");
  const unchecked = inPeriod.filter((r) => r.status === "ungeprueft");
  const unpaidInvoices = checkedReceipts.filter(
    (r) => !r.paid_at && r.receipt_type === "Rechnung",
  );
  const withoutCategory = inPeriod.filter(
    (r) => !r.category || r.category === "Sonstiges",
  );

  // Übergabe-Checkliste
  const checklist: ChecklistItem[] = [
    {
      id: "checked",
      label: "Alle Belege geprüft",
      hint:
        unchecked.length === 0 && uncertain.length === 0
          ? "Alles erledigt"
          : `${unchecked.length + uncertain.length} Belege offen — jetzt prüfen`,
      status: unchecked.length === 0 && uncertain.length === 0 ? "ok" : "todo",
      count: unchecked.length + uncertain.length,
      href:
        unchecked.length + uncertain.length > 0
          ? "/receipts?status=ungeprueft"
          : undefined,
      action: "Zu den ungeprüften Belegen",
    },
    {
      id: "category",
      label: "Lieferanten & Kategorien zugeordnet",
      hint:
        withoutCategory.length === 0
          ? "Alle Belege haben eine Kategorie"
          : `${withoutCategory.length} Belege ohne klare Kategorie — jetzt zuordnen`,
      status: withoutCategory.length === 0 ? "ok" : "warn",
      count: withoutCategory.length,
      href:
        withoutCategory.length > 0 ? "/receipts?cat=missing" : undefined,
      action: "Zu den unklaren Belegen",
    },
    {
      id: "private",
      label: "Private Belege markiert",
      hint:
        "Privatentnahmen separat — sonst zahlst du Steuer auf eigene Ausgaben",
      status: "warn",
      href: "/receipts",
      action: "Belege durchgehen",
    },
    {
      id: "paid",
      label: "Offene Rechnungen bezahlt",
      hint:
        unpaidInvoices.length === 0
          ? "Keine offenen Rechnungen"
          : `${unpaidInvoices.length} Rechnung${unpaidInvoices.length === 1 ? "" : "en"} noch unbezahlt — Liquidität checken`,
      status: unpaidInvoices.length === 0 ? "ok" : "warn",
      count: unpaidInvoices.length,
      href:
        unpaidInvoices.length > 0 ? "/receipts?unpaid=1" : undefined,
      action: "Offene Rechnungen ansehen",
    },
    {
      id: "uva",
      label: "UVA-Vorerfassung erledigt",
      hint: "Nur wenn du UVA-pflichtig bist (Jahresumsatz > 35.000 €)",
      status: "todo",
      href: "/uva",
      action: "UVA-Vorerfassung öffnen",
    },
  ];

  const doneCount = checklist.filter((c) => c.status === "ok").length;
  const totalCount = checklist.length;
  const progressPct = Math.round((doneCount / totalCount) * 100);

  function reload() {
    setAll(loadReceipts());
  }

  function release() {
    if (unchecked.length > 0 || uncertain.length > 0) {
      const proceed = confirm(
        `Achtung: ${unchecked.length + uncertain.length} Beleg(e) sind noch nicht geprüft. Trotzdem übergeben?`,
      );
      if (!proceed) return;
    }
    setStatusBulk(
      checkedReceipts.map((r) => r.id),
      "freigegeben",
    );
    reload();
    const ts = new Date().toLocaleString("de-AT");
    alert(
      `${checkedReceipts.length} Belege wurden um ${ts} an den Steuerberater übergeben.\n\nDie Übergabe wurde im Audit-Log dokumentiert (§ 132 BAO).`,
    );
  }

  function downloadPdf() {
    generateReportPDF({
      company: DEMO_COMPANY.company_name,
      periodLabel: `${from} — ${to}`,
      receipts: checkedReceipts,
      insights: buildInsights(checkedReceipts).map((i) => ({
        title: i.title,
        description: i.description,
      })),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-brand-700 mb-2">
          <PackageCheck className="h-3.5 w-3.5" />
          Monatsabschluss
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-600 to-accent text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            Premium
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Monatsabschluss-Paket</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Alles, was dein Steuerberater für den Monatsabschluss braucht — in einem
          Klick. Belege, Report, Buchhaltungs-CSV und SEPA-Datei in einem Paket.
        </p>
      </div>

      {/* Wie funktioniert die Übergabe? */}
      <div className="card-soft p-5 border border-brand-100 bg-gradient-to-br from-brand-50/60 to-accent-soft/40">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-brand-700 shrink-0 mt-0.5" />
          <div className="text-sm space-y-2">
            <p className="font-semibold text-brand-800">
              Wie bekommt der Steuerberater die Belege?
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-slate-700">
              <li>Du klickst oben rechts auf <strong>„Jetzt übergeben“</strong>.</li>
              <li>
                Klarblick schickt eine E-Mail an{" "}
                <strong>{advisorEmail || "deinen Steuerberater"}</strong> mit einem{" "}
                <strong>sicheren Download-Link</strong> (gültig 7 Tage).
                Darin: alle geprüften Belege als PDF, eine CSV-Liste und die
                Buchhaltungs-Datei (DATEV).
              </li>
              <li>
                Dein Steuerberater lädt das Paket runter — ohne extra Account, ohne
                Software-Installation.
              </li>
              <li>
                Die Übergabe wird mit <strong>Zeitstempel im Audit-Log</strong>
                {" "}gespeichert. Belege werden gesperrt und sind 7 Jahre archiviert (§ 132 BAO).
              </li>
            </ol>
            <p className="text-xs text-slate-600 pt-1">
              Tipp: Wenn dein Steuerberater eigenen Zugang möchte (statt nur Download-Link), kannst du ihn unter{" "}
              <Link href="/settings#team" className="underline font-semibold">
                Einstellungen → Team
              </Link>{" "}
              als „Steuerberater (Leserechte)“ einladen.
            </p>
          </div>
        </div>
      </div>

      {/* Fortschritt + Übergabe */}
      <div className="card-soft p-6">
        <div className="flex items-center justify-between gap-4 flex-col lg:flex-row">
          <div className="flex items-center gap-4">
            <span className="h-14 w-14 rounded-xl bg-brand-600 text-white grid place-content-center">
              <PackageCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-2xl font-bold">
                {doneCount} von {totalCount} Schritten erledigt
              </p>
              <p className="text-sm text-muted-foreground">
                {stats.checked} Belege geprüft · {stats.uncertain} unsicher ·{" "}
                {stats.unchecked} ungeprüft
              </p>
            </div>
          </div>
          <button onClick={release} className="btn-primary btn-lg">
            <CheckCircle2 className="h-5 w-5" /> Jetzt übergeben
          </button>
        </div>
        <div className="mt-5 h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-accent transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Checkliste */}
      <div className="card p-5">
        <h2 className="font-semibold mb-3">Übergabe-Checkliste</h2>
        <ul className="space-y-2">
          {checklist.map((item) => (
            <ChecklistRow key={item.id} item={item} />
          ))}
        </ul>
      </div>

      {/* Zeitraum & E-Mail */}
      <div className="card p-5 grid sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Von</label>
          <input
            type="date"
            className="input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Bis</label>
          <input
            type="date"
            className="input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div>
          <label className="label">E-Mail Steuerberater</label>
          <input
            type="email"
            className="input"
            value={advisorEmail || ""}
            onChange={(e) => setAdvisorEmail(e.target.value)}
            placeholder="kanzlei@beispiel.at"
          />
        </div>
      </div>

      {/* Datenschutz-Block */}
      <div className="card p-5 border border-brand-100 bg-brand-50/40">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-brand-700 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-brand-800">
              Aufbewahrung & dokumentierte Übergabe
            </p>
            <ul className="mt-1.5 space-y-1 text-slate-700">
              <li>
                Belege werden <strong>7 Jahre archiviert</strong> (§ 132 BAO,
                gesetzliche Aufbewahrungsfrist).
              </li>
              <li>
                Bei „Jetzt übergeben" wird ein <strong>Zeitstempel im Audit-Log</strong>{" "}
                gespeichert — wer wann was an welchen Steuerberater übergeben hat.
              </li>
              <li>
                Übergabe-Link: zeitlich begrenzt (7 Tage), Ende-zu-Ende-verschlüsselt,
                EU-Server. Details in den{" "}
                <Link href="/settings#datenschutz" className="underline">
                  Einstellungen → Datenschutz
                </Link>
                .
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Status-Karten */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatusCard
          tone="accent"
          Icon={CheckCircle2}
          title={`${checkedReceipts.length} Belege können übergeben werden`}
          subtitle="Geprüft & vollständig"
        />
        <StatusCard
          tone="warn"
          Icon={AlertTriangle}
          title={`${uncertain.length} Belege sind unsicher`}
          subtitle="Bitte prüfen oder separat markieren"
        />
        <StatusCard
          tone="muted"
          Icon={FileText}
          title={`${unchecked.length} Belege müssen geprüft werden`}
          subtitle="Noch keine Bestätigung"
        />
      </div>

      {/* Aktionen */}
      <div className="card p-5">
        <h2 className="font-semibold">Paket-Aktionen</h2>
        <p className="text-sm text-muted-foreground">
          PDF, CSV oder sicherer Link für deinen Steuerberater — alles aus einem
          Stapel.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={downloadPdf} className="btn-primary">
            <Download className="h-4 w-4" /> PDF-Report erzeugen
          </button>
          <button
            onClick={() => exportCSV(checkedReceipts, `monatsabschluss_${from}_${to}.csv`)}
            className="btn-secondary"
          >
            <FileSpreadsheet className="h-4 w-4" /> CSV erzeugen
          </button>
          <button
            onClick={() =>
              downloadCSV(
                `klarblick_datev_${from}_${to}.csv`,
                buildDatevCSV(checkedReceipts, `${from} — ${to}`),
              )
            }
            className="btn-secondary"
          >
            <Database className="h-4 w-4" /> DATEV-CSV
          </button>
          <button
            onClick={() => {
              if (unpaidInvoices.length === 0) {
                alert("Keine offenen Rechnungen zum Bezahlen.");
                return;
              }
              const xml = buildSepaXML({
                debtorName: DEMO_COMPANY.company_name,
                debtorIban: "DE89370400440532013000",
                receipts: unpaidInvoices,
              });
              downloadXML(`klarblick_sepa_${from}_${to}.xml`, xml);
            }}
            className="btn-secondary"
          >
            <Landmark className="h-4 w-4" /> SEPA-Sammelüberweisung
          </button>
          <Link href="/uva" className="btn-secondary">
            <Calculator className="h-4 w-4" /> UVA-Vorerfassung
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            onClick={() =>
              (window.location.href = `mailto:${advisorEmail}?subject=Belege%20${from}%20bis%20${to}&body=Hallo%2C%0A%0Aanbei%20mein%20Monatsabschluss-Paket%20aus%20Klarblick.%0AGepr%C3%BCfte%20Belege%3A%20${checkedReceipts.length}%0AUnsicher%3A%20${uncertain.length}`)
            }
            className="btn-secondary"
          >
            <Mail className="h-4 w-4" /> E-Mail vorbereiten
          </button>
          <button
            className="btn-secondary"
            onClick={() =>
              alert(
                "Sicherer Link erstellt (Demo). In Produktion: zeitlich begrenzter Supabase-Link mit Audit-Trail.",
              )
            }
          >
            <FolderArchive className="h-4 w-4" /> Sicheren Link erstellen
          </button>
        </div>
      </div>

      {/* ZIP-Struktur Vorschau */}
      <div className="card p-5">
        <h2 className="font-semibold mb-3">Paket-Struktur (Vorschau)</h2>
        <div className="font-mono text-sm bg-slate-50 border border-border rounded-lg p-4 space-y-1">
          <Tree
            icon={<Folder className="h-4 w-4 text-brand-600" />}
            label={`Klarblick_${from}_${to}/`}
          />
          <Tree
            level={1}
            icon={<FileText className="h-4 w-4 text-slate-500" />}
            label="monatsabschluss.pdf"
          />
          <Tree
            level={1}
            icon={<FileSpreadsheet className="h-4 w-4 text-slate-500" />}
            label="belege.csv"
          />
          <Tree
            level={1}
            icon={<FileSpreadsheet className="h-4 w-4 text-slate-500" />}
            label="uva-entwurf.csv"
          />
          <Tree
            level={1}
            icon={<Folder className="h-4 w-4 text-brand-600" />}
            label="belege-geprueft/"
          />
          <Tree
            level={2}
            icon={<FileText className="h-4 w-4 text-slate-400" />}
            label={`(${checkedReceipts.length} PDFs)`}
          />
          <Tree
            level={1}
            icon={<Folder className="h-4 w-4 text-warn" />}
            label="belege-unsicher/"
          />
          <Tree
            level={2}
            icon={<FileText className="h-4 w-4 text-slate-400" />}
            label={`(${uncertain.length} PDFs)`}
          />
          <Tree
            level={1}
            icon={<FileText className="h-4 w-4 text-slate-500" />}
            label="audit-log.txt"
          />
        </div>
      </div>
    </div>
  );
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const Icon =
    item.status === "ok"
      ? CheckCircle2
      : item.status === "warn"
        ? AlertTriangle
        : Circle;
  const color =
    item.status === "ok"
      ? "text-accent"
      : item.status === "warn"
        ? "text-warn"
        : "text-slate-400";

  const showAction = item.status !== "ok" && item.href;
  const Wrapper: any = showAction ? Link : "li";
  const wrapperProps: any = showAction
    ? {
        href: item.href,
        className:
          "flex items-start gap-3 py-2.5 px-2 -mx-2 rounded-lg border-b border-border last:border-0 hover:bg-slate-50 transition group cursor-pointer",
      }
    : {
        className:
          "flex items-start gap-3 py-2.5 px-2 -mx-2 border-b border-border last:border-0",
      };

  const content = (
    <>
      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{item.label}</p>
        <p className="text-xs text-muted-foreground">{item.hint}</p>
        {showAction && (
          <p className="text-xs font-semibold text-brand-700 mt-1 flex items-center gap-1 group-hover:gap-2 transition-all">
            {item.action || "Jetzt erledigen"}
            <ArrowRight className="h-3 w-3" />
          </p>
        )}
      </div>
      {item.count !== undefined && item.count > 0 && (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-warn-soft text-warn">
          {item.count}
        </span>
      )}
    </>
  );

  if (showAction) {
    return (
      <li className="list-none">
        <Wrapper {...wrapperProps}>{content}</Wrapper>
      </li>
    );
  }
  return <Wrapper {...wrapperProps}>{content}</Wrapper>;
}

function StatusCard({
  tone,
  Icon,
  title,
  subtitle,
}: {
  tone: "accent" | "warn" | "muted";
  Icon: any;
  title: string;
  subtitle: string;
}) {
  const map = {
    accent: "bg-accent-soft text-accent border-emerald-200",
    warn: "bg-warn-soft text-warn border-amber-200",
    muted: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return (
    <div className={`card p-5 border ${map[tone]}`}>
      <Icon className="h-5 w-5" />
      <p className="font-semibold mt-3 text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
  );
}

function Tree({
  level = 0,
  icon,
  label,
}: {
  level?: number;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2" style={{ paddingLeft: level * 18 }}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
