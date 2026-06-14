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
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Steuerberater-Übergabe</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {from && to ? `${from} – ${to}` : "Zeitraum"} ·{" "}
            {checkedReceipts.length} Belege bereit · {stats.unchecked + stats.uncertain} offen
          </p>
        </div>
        <button
          onClick={release}
          disabled={checkedReceipts.length === 0}
          className="btn-primary"
        >
          <CheckCircle2 className="h-4 w-4" />
          {checkedReceipts.length} Belege übergeben
        </button>
      </div>

      {/* Fortschrittsbalken */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{doneCount} von {totalCount} Schritten erledigt</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-slate-800 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Checkliste */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Checkliste</h2>
        <ul className="divide-y divide-slate-100">
          {checklist.map((item) => (
            <ChecklistRow key={item.id} item={item} />
          ))}
        </ul>
      </div>

      {/* Zeitraum + E-Mail */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Von</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">Bis</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="label">E-Mail Steuerberater</label>
          <input type="email" className="input" value={advisorEmail || ""}
            onChange={(e) => setAdvisorEmail(e.target.value)} placeholder="kanzlei@beispiel.at" />
        </div>
      </div>

      {/* Downloads */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Downloads</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadPdf} className="btn-secondary">
            <Download className="h-4 w-4" /> PDF-Report
          </button>
          <button onClick={() => exportCSV(checkedReceipts, `belege_${from}_${to}.csv`)} className="btn-secondary">
            <FileSpreadsheet className="h-4 w-4" /> CSV
          </button>
          <button onClick={() => downloadCSV(`datev_${from}_${to}.csv`, buildDatevCSV(checkedReceipts, `${from} — ${to}`))} className="btn-secondary">
            <Database className="h-4 w-4" /> DATEV-CSV
          </button>
          <button onClick={() => {
            if (!unpaidInvoices.length) { alert("Keine offenen Rechnungen."); return; }
            downloadXML(`sepa_${from}_${to}.xml`, buildSepaXML({ debtorName: DEMO_COMPANY.company_name, debtorIban: "AT63201118278479 5500", receipts: unpaidInvoices }));
          }} className="btn-secondary">
            <Landmark className="h-4 w-4" /> SEPA
          </button>
          <button onClick={() => (window.location.href = `mailto:${advisorEmail}?subject=Belege%20${from}%20bis%20${to}`)} className="btn-secondary">
            <Mail className="h-4 w-4" /> E-Mail
          </button>
          <Link href="/uva" className="btn-secondary">
            <Calculator className="h-4 w-4" /> UVA
          </Link>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Übergabe wird mit Zeitstempel im Audit-Log gespeichert (§ 132 BAO, 7 Jahre Aufbewahrung).
        </p>
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
