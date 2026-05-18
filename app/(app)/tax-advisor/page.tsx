"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  FolderArchive,
  Download,
  Mail,
  Folder,
  FileText,
  FileSpreadsheet,
  Database,
  Landmark,
} from "lucide-react";
import { loadReceipts, setStatusBulk } from "@/lib/store";
import type { Receipt } from "@/lib/types";
import { formatEUR } from "@/lib/utils";
import { exportCSV, generateReportPDF } from "@/lib/pdf";
import { buildDatevCSV, downloadCSV } from "@/lib/datev";
import { buildSepaXML, downloadXML } from "@/lib/sepa";
import { buildInsights, periodStats } from "@/lib/insights";
import { DEMO_COMPANY } from "@/lib/demo-data";
export default function TaxAdvisorPage() {
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
    () => all.filter((r) => (!from || r.receipt_date >= from) && (!to || r.receipt_date <= to)),
    [all, from, to]
  );

  const stats = periodStats(inPeriod);
  const checkedReceipts = inPeriod.filter((r) => r.status === "geprueft" || r.status === "freigegeben");
  const uncertain = inPeriod.filter((r) => r.status === "unsicher");
  const unchecked = inPeriod.filter((r) => r.status === "ungeprueft");

  function reload() {
    setAll(loadReceipts());
  }

  function release() {
    setStatusBulk(
      checkedReceipts.map((r) => r.id),
      "freigegeben"
    );
    reload();
    alert(`${checkedReceipts.length} Belege wurden an den Steuerberater freigegeben.`);
  }

  function downloadPdf() {
    generateReportPDF({
      company: DEMO_COMPANY.company_name,
      periodLabel: `${from} � ${to}`,
      receipts: checkedReceipts,
      insights: buildInsights(checkedReceipts).map((i) => ({ title: i.title, description: i.description })),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Steuerberater-Paket</h1>
        <p className="text-muted-foreground mt-1">
          Bereite dein Paket vor � gepr�fte Belege, Report und CSV in einem.
        </p>
      </div>

      {/* Progress */}
      <div className="card-soft p-6">
        <div className="flex items-center justify-between gap-4 flex-col lg:flex-row">
          <div className="flex items-center gap-4">
            <span className="h-14 w-14 rounded-xl bg-brand-600 text-white grid place-content-center">
              <Send className="h-6 w-6" />
            </span>
            <div>
              <p className="text-2xl font-bold">Dein Paket ist zu {stats.advisorReadyPct} % bereit</p>
              <p className="text-sm text-muted-foreground">
                {stats.checked} Belege gepr�ft � {stats.uncertain} unsicher � {stats.unchecked} ungepr�ft
              </p>
            </div>
          </div>
          <button onClick={release} className="btn-primary btn-lg">
            <CheckCircle2 className="h-5 w-5" /> �bergabe vorbereiten
          </button>
        </div>
        <div className="mt-5 h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-accent transition-all"
            style={{ width: `${stats.advisorReadyPct}%` }}
          />
        </div>
      </div>

      {/* Zeitraum & E-Mail */}
      <div className="card p-5 grid sm:grid-cols-3 gap-4">
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
          <input
            type="email"
            className="input"
            value={advisorEmail || ""}
            onChange={(e) => setAdvisorEmail(e.target.value)}
            placeholder="kanzlei@beispiel.de"
          />
        </div>
      </div>

      {/* Status-Karten */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatusCard
          tone="accent"
          Icon={CheckCircle2}
          title={`${checkedReceipts.length} Belege k�nnen �bergeben werden`}
          subtitle="Gepr�ft & vollst�ndig"
        />
        <StatusCard
          tone="warn"
          Icon={AlertTriangle}
          title={`${uncertain.length} Belege sind unsicher`}
          subtitle="Bitte pr�fen oder separat markieren"
        />
        <StatusCard
          tone="muted"
          Icon={FileText}
          title={`${unchecked.length} Belege m�ssen gepr�ft werden`}
          subtitle="Noch keine Best�tigung"
        />
      </div>

      {/* Aktionen */}
      <div className="card p-5">
        <h2 className="font-semibold">Paket-Aktionen</h2>
        <p className="text-sm text-muted-foreground">
          Erzeuge PDF, CSV oder einen sicheren Link f�r deinen Steuerberater.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={downloadPdf} className="btn-primary">
            <Download className="h-4 w-4" /> PDF-Report erzeugen
          </button>
          <button
            onClick={() => exportCSV(checkedReceipts, `steuerberater_${from}_${to}.csv`)}
            className="btn-secondary"
          >
            <FileSpreadsheet className="h-4 w-4" /> CSV erzeugen
          </button>
          <button
            onClick={() =>
              downloadCSV(
                `klarblick_datev_${from}_${to}.csv`,
                buildDatevCSV(checkedReceipts, `${from} � ${to}`),
              )
            }
            className="btn-secondary"
          >
            <Database className="h-4 w-4" /> DATEV-CSV exportieren
          </button>
          <button
            onClick={() => {
              const open = checkedReceipts.filter((r) => !r.paid_at && r.receipt_type === "Rechnung");
              if (open.length === 0) {
                alert("Keine offenen Rechnungen zum Bezahlen.");
                return;
              }
              const xml = buildSepaXML({
                debtorName: DEMO_COMPANY.company_name,
                debtorIban: "DE89370400440532013000",
                receipts: open,
              });
              downloadXML(`klarblick_sepa_${from}_${to}.xml`, xml);
            }}
            className="btn-secondary"
          >
            <Landmark className="h-4 w-4" /> SEPA-XML (Sammel�berweisung)
          </button>
          <button
            onClick={() =>
              (window.location.href = `mailto:${advisorEmail}?subject=Belege%20${from}%20bis%20${to}&body=Hallo%2C%0A%0Aanbei%20mein%20Paket%20aus%20Klarblick.%0AGepr%C3%BCfte%20Belege%3A%20${checkedReceipts.length}%0AUnsicher%3A%20${uncertain.length}`)
            }
            className="btn-secondary"
          >
            <Mail className="h-4 w-4" /> E-Mail vorbereiten
          </button>
          <button
            className="btn-secondary"
            onClick={() => alert("Sicherer Link erstellt (Mock). In Produktion: zeitlich begrenzter Supabase-Link.")}
          >
            <FolderArchive className="h-4 w-4" /> Sicheren Link erstellen
          </button>
        </div>
      </div>

      {/* ZIP-Struktur Konzept */}
      <div className="card p-5">
        <h2 className="font-semibold mb-3">Paket-Struktur (Vorschau)</h2>
        <div className="font-mono text-sm bg-slate-50 border border-border rounded-lg p-4 space-y-1">
          <Tree icon={<Folder className="h-4 w-4 text-brand-600" />} label={`Klarblick_${from}_${to}/`} />
          <Tree level={1} icon={<FileText className="h-4 w-4 text-slate-500" />} label="management-report.pdf" />
          <Tree level={1} icon={<FileSpreadsheet className="h-4 w-4 text-slate-500" />} label="belege.csv" />
          <Tree level={1} icon={<Folder className="h-4 w-4 text-brand-600" />} label="belege-geprueft/" />
          <Tree level={2} icon={<FileText className="h-4 w-4 text-slate-400" />} label={`(${checkedReceipts.length} PDFs)`} />
          <Tree level={1} icon={<Folder className="h-4 w-4 text-warn" />} label="belege-unsicher/" />
          <Tree level={2} icon={<FileText className="h-4 w-4 text-slate-400" />} label={`(${uncertain.length} PDFs)`} />
          <Tree level={1} icon={<FileText className="h-4 w-4 text-slate-500" />} label="readme.txt" />
        </div>
      </div>
</div>
  );
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
