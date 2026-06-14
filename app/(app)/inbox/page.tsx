"use client";

/**
 * Eingang — WhatsApp + E-Mail in einer einheitlichen Inbox.
 *
 * Tab "WhatsApp": Fotos/PDFs die per WhatsApp an Klarblick geschickt wurden
 *                 (eigene Belege UND Fotos von Kollegen)
 * Tab "E-Mail":   Rechnungen die per E-Mail weitergeleitet wurden
 *
 * Pro Eintrag: Vorschau der OCR-Daten → Felder korrigieren → "Importieren"
 */

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Mail,
  Download,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Select } from "@/components/Select";

// ── Typen ─────────────────────────────────────────────────────────────────────

interface WaMessage {
  id: string;
  sender_phone: string;
  sender_name: string | null;
  body: string | null;
  media_url: string | null;
  media_type: string | null;
  ocr_data: any | null;
  status: "pending" | "imported" | "failed" | "no_media";
  receipt_id: string | null;
  created_at: string;
}

interface EmailItem {
  id: string;
  from_address: string;
  subject: string;
  received_at: string;
  status: string;
  attachment_count: number;
  ocr_data: any[] | any | null;
  processed_receipt_id: string | null;
}

// ── Hauptseite ─────────────────────────────────────────────────────────────────

// ── Demo-Daten (wenn kein Supabase-Login) ─────────────────────────────────────

const DEMO_WA: WaMessage[] = [
  {
    id: "demo-wa-1",
    sender_phone: "+43 664 123 45 67",
    sender_name: "Thomas Maier",
    body: null,
    media_url: "demo",
    media_type: "image/jpeg",
    ocr_data: { vendor: "Shell Tankstelle Wien", date: "2026-06-12", gross_amount: 87.40, net_amount: 72.83, vat_amount: 14.57, vat_rate: 20, category: "Treibstoff/KFZ", invoice_type: "eingang", warnings: [] },
    status: "pending",
    receipt_id: null,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "demo-wa-2",
    sender_phone: "+43 664 987 65 43",
    sender_name: "Kollege Peter",
    body: "Beleg von Baustelle Linz",
    media_url: "demo",
    media_type: "image/jpeg",
    ocr_data: { vendor: "Würth GmbH", date: "2026-06-11", gross_amount: 234.00, net_amount: 195.00, vat_amount: 39.00, vat_rate: 20, category: "Werkzeug/Material", invoice_type: "eingang", warnings: [] },
    status: "pending",
    receipt_id: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "demo-wa-3",
    sender_phone: "+43 664 555 11 22",
    sender_name: null,
    body: "Beleg vom Baumarkt",
    media_url: "demo",
    media_type: "image/jpeg",
    ocr_data: null,
    status: "failed",
    receipt_id: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

const DEMO_EMAIL: EmailItem[] = [
  {
    id: "demo-email-1",
    from_address: "rechnungen@amazon.de",
    subject: "Ihre Amazon Business Rechnung RE-2026-0614",
    received_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    status: "pending",
    attachment_count: 1,
    ocr_data: { vendor: "Amazon Business EU", date: "2026-06-13", gross_amount: 156.80, net_amount: 130.67, vat_amount: 26.13, vat_rate: 20, category: "Bürobedarf", invoice_type: "eingang", warnings: [] },
    processed_receipt_id: null,
  },
  {
    id: "demo-email-2",
    from_address: "buchhaltung@lieferant-gmbh.at",
    subject: "Rechnung Nr. 2026-1842",
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: "pending",
    attachment_count: 2,
    ocr_data: { vendor: "Lieferant GmbH", date: "2026-06-10", gross_amount: 1240.00, net_amount: 1033.33, vat_amount: 206.67, vat_rate: 20, category: "Wareneinkauf", invoice_type: "eingang", warnings: ["Betrag ungewöhnlich hoch — bitte prüfen"] },
    processed_receipt_id: null,
  },
];

export default function InboxPage() {
  const [tab, setTab] = useState<"wa" | "email">("wa");
  const [waItems, setWaItems] = useState<WaMessage[]>([]);
  const [emailItems, setEmailItems] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [waPending, setWaPending] = useState(0);
  const [emailPending, setEmailPending] = useState(0);
  const [isDemo, setIsDemo] = useState(false);

  async function loadWa() {
    const res = await fetch("/api/whatsapp/messages?status=pending");
    if (res.status === 401) return null; // Nicht eingeloggt
    const data = await res.json();
    return (data.items ?? []) as WaMessage[];
  }

  async function loadEmail() {
    const res = await fetch("/api/inbox?status=pending");
    if (res.status === 401) return null;
    const data = await res.json();
    return (data.items ?? []) as EmailItem[];
  }

  async function reload() {
    setLoading(true);
    const [wa, email] = await Promise.all([loadWa(), loadEmail()]);
    const demo = wa === null && email === null;
    setIsDemo(demo);
    const waList = demo ? DEMO_WA : (wa ?? []);
    const emailList = demo ? DEMO_EMAIL : (email ?? []);
    setWaItems(waList);
    setEmailItems(emailList);
    setWaPending(waList.filter((m) => m.status === "pending" || m.status === "failed").length);
    setEmailPending(emailList.length);
    setLoading(false);
  }

  useEffect(() => { reload(); }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Beleg-Check</h1>
          <p className="text-muted-foreground mt-1">
            Per WhatsApp oder E-Mail eingegangene Belege prüfen und in die Belegliste übernehmen.
          </p>
        </div>
        <button className="btn-secondary btn-sm" onClick={reload} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </button>
      </div>

      {/* Demo-Banner */}
      {isDemo && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <strong>Demo-Ansicht</strong> — diese Belege sind Beispieldaten.
            Nach dem Login siehst du deine echten WhatsApp- und E-Mail-Belege hier.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        <TabButton
          active={tab === "wa"}
          onClick={() => setTab("wa")}
          icon={<MessageSquare className="h-4 w-4" />}
          label="WhatsApp"
          badge={waPending}
        />
        <TabButton
          active={tab === "email"}
          onClick={() => setTab("email")}
          icon={<Mail className="h-4 w-4" />}
          label="E-Mail"
          badge={emailPending}
        />
      </div>

      {/* Setup-Hinweis */}
      {tab === "wa" && (
        <SetupHint
          icon={<MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />}
          steps={[
            "Verifiziere deine Nummer unter Einstellungen → WhatsApp-Eingang",
            "Schicke ein Foto deines Belegs an die Klarblick-WhatsApp-Nummer",
            "Kollegen schicken ebenfalls an diese Nummer — Belege erscheinen hier zur Freigabe",
          ]}
        />
      )}
      {tab === "email" && (
        <SetupHint
          icon={<Mail className="h-4 w-4 shrink-0 mt-0.5" />}
          steps={[
            'Leite Rechnungs-Mails an deine Klarblick-Adresse weiter (z.B. belege@klarblick.at)',
            "Kollegen können Rechnungen direkt an diese Adresse CC setzen",
            'Anhänge werden automatisch ausgelesen — hier "Importieren" klicken',
          ]}
        />
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Laden …
        </div>
      )}

      {/* WhatsApp-Liste */}
      {!loading && tab === "wa" && (
        <>
          {waItems.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="h-12 w-12 opacity-30" />}
              title="Keine ausstehenden WhatsApp-Belege"
              desc="Schick ein Foto an die Klarblick-WhatsApp-Nummer — es erscheint hier."
            />
          ) : (
            <div className="space-y-3">
              {waItems.map((msg) => (
                <WaCard key={msg.id} msg={msg} onImported={reload} isDemo={isDemo} />
              ))}
            </div>
          )}
        </>
      )}

      {/* E-Mail-Liste */}
      {!loading && tab === "email" && (
        <>
          {emailItems.length === 0 ? (
            <EmptyState
              icon={<Mail className="h-12 w-12 opacity-30" />}
              title="Keine ausstehenden E-Mails"
              desc="Leite eine Rechnungs-Mail weiter — sie erscheint automatisch hier."
            />
          ) : (
            <div className="space-y-3">
              {emailItems.map((item) => (
                <EmailCard key={item.id} item={item} onImported={reload} isDemo={isDemo} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Tab-Button ─────────────────────────────────────────────────────────────────

function TabButton({
  active, onClick, icon, label, badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 px-4 text-sm font-medium transition-colors ${
        active ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
      {badge > 0 && (
        <span className="h-5 min-w-[20px] rounded-full bg-brand-600 text-white text-xs grid place-content-center px-1">
          {badge}
        </span>
      )}
    </button>
  );
}

function SetupHint({ icon, steps }: { icon: React.ReactNode; steps: string[] }) {
  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-xs text-brand-800 flex gap-3">
      <span className="text-brand-600 mt-0.5">{icon}</span>
      <ol className="list-decimal list-inside space-y-1">
        {steps.map((s, i) => <li key={i}>{s}</li>)}
      </ol>
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      {icon}
      <p className="font-medium mt-3">{title}</p>
      <p className="text-sm mt-1">{desc}</p>
    </div>
  );
}

// ── WhatsApp-Karte ─────────────────────────────────────────────────────────────

function WaCard({ msg, onImported, isDemo }: { msg: WaMessage; onImported: () => void; isDemo?: boolean }) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const ocr = msg.ocr_data;
  const timeAgo = formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: de });
  const senderLabel = msg.sender_name || msg.sender_phone;
  const isPdf = msg.media_type === "application/pdf";

  async function doImport() {
    setImporting(true);
    try {
      const res = await fetch(`/api/whatsapp/messages/${msg.id}/import`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ overrides }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setDone(true);
      setTimeout(onImported, 800);
    } catch (e: any) {
      alert(`Import fehlgeschlagen: ${e.message}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className={`card overflow-hidden transition-opacity ${done ? "opacity-50" : ""}`}>
      <button
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="mt-0.5 h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 grid place-content-center shrink-0">
          {isPdf ? <FileText className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-muted-foreground" />
            <p className="text-sm font-medium truncate">{senderLabel}</p>
          </div>
          {msg.body && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.body}</p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            {ocr?.vendor && (
              <span className="pill bg-slate-100 text-slate-700 text-xs">
                {ocr.vendor}
              </span>
            )}
            {ocr?.gross_amount && (
              <span className="pill bg-brand-50 text-brand-700 text-xs border-brand-200 font-mono">
                {Number(ocr.gross_amount).toFixed(2)} €
              </span>
            )}
            {msg.status === "failed" && (
              <span className="pill bg-red-50 text-red-600 text-xs border-red-200 gap-1">
                <AlertCircle className="h-3 w-3" /> OCR fehlgeschlagen
              </span>
            )}
          </div>
        </div>
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        ) : open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        )}
      </button>

      {open && !done && (
        <div className="border-t border-border p-4 space-y-4">
          {ocr ? (
            <OcrEditForm ocr={ocr} onChange={setOverrides} />
          ) : (
            <p className="text-sm text-muted-foreground">
              OCR-Daten nicht verfügbar — Beleg konnte nicht ausgelesen werden.
              Du kannst ihn trotzdem manuell importieren.
            </p>
          )}
          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={() => setOpen(false)}>
              Schließen
            </button>
            {isDemo ? (
              <button className="btn-secondary flex-1 opacity-50 cursor-not-allowed" disabled>
                <Download className="h-4 w-4" />
                Demo — kein Import
              </button>
            ) : (
              <button className="btn-primary flex-1" onClick={doImport} disabled={importing}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {importing ? "Importiere …" : "In Belegliste importieren"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── E-Mail-Karte ───────────────────────────────────────────────────────────────

function EmailCard({ item, onImported, isDemo }: { item: EmailItem; onImported: () => void; isDemo?: boolean }) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const ocr = Array.isArray(item.ocr_data) ? item.ocr_data[0] : item.ocr_data;
  const timeAgo = formatDistanceToNow(new Date(item.received_at), { addSuffix: true, locale: de });

  async function doImport() {
    setImporting(true);
    try {
      const res = await fetch(`/api/inbox/${item.id}/import`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ overrides }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setDone(true);
      setTimeout(onImported, 800);
    } catch (e: any) {
      alert(`Import fehlgeschlagen: ${e.message}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className={`card overflow-hidden transition-opacity ${done ? "opacity-50" : ""}`}>
      <button
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="mt-0.5 h-8 w-8 rounded-lg bg-blue-50 text-blue-600 grid place-content-center shrink-0">
          <Mail className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.subject || "(kein Betreff)"}</p>
          <p className="text-xs text-muted-foreground truncate">{item.from_address}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            {item.attachment_count > 0 && (
              <span className="pill bg-slate-100 text-slate-600 text-xs">
                <FileText className="h-3 w-3" />
                {item.attachment_count} Anhang{item.attachment_count > 1 ? "änge" : ""}
              </span>
            )}
            {ocr?.vendor && (
              <span className="pill bg-slate-100 text-slate-700 text-xs">{ocr.vendor}</span>
            )}
            {ocr?.gross_amount && (
              <span className="pill bg-brand-50 text-brand-700 text-xs border-brand-200 font-mono">
                {Number(ocr.gross_amount).toFixed(2)} €
              </span>
            )}
          </div>
        </div>
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        ) : open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        )}
      </button>

      {open && !done && (
        <div className="border-t border-border p-4 space-y-4">
          {ocr ? (
            <OcrEditForm ocr={ocr} onChange={setOverrides} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Kein Anhang erkannt oder OCR ausstehend.
            </p>
          )}
          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={() => setOpen(false)}>
              Schließen
            </button>
            {isDemo ? (
              <button className="btn-secondary flex-1 opacity-50 cursor-not-allowed" disabled>
                <Download className="h-4 w-4" />
                Demo — kein Import
              </button>
            ) : (
              <button className="btn-primary flex-1" onClick={doImport} disabled={importing}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {importing ? "Importiere …" : "In Belegliste importieren"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── OCR-Bearbeitungsformular (geteilt für WA + E-Mail) ────────────────────────

const CATEGORIES = [
  "Wareneinkauf", "Werkzeug/Material", "Treibstoff/KFZ", "Bürobedarf",
  "Software/IT", "Bewirtung", "Versicherung", "Miete/Leasing",
  "Werbung/Marketing", "Reise/Diäten", "Bau/Instandhaltung", "Personal/Lohn", "Sonstiges",
];

function OcrEditForm({
  ocr,
  onChange,
}: {
  ocr: any;
  onChange: (overrides: Record<string, string>) => void;
}) {
  const [vals, setVals] = useState({
    supplier_name: ocr.vendor ?? "",
    receipt_date: ocr.date ?? "",
    gross_amount: ocr.gross_amount ? String(ocr.gross_amount) : "",
    vat_rate: String(ocr.vat_rate ?? 20),
    category: ocr.category ?? "Sonstiges",
    invoice_type: ocr.invoice_type ?? "eingang",
  });

  function update(key: string, value: string) {
    const next = { ...vals, [key]: value };
    setVals(next);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Erkannte Beleg-Daten — bitte prüfen
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Lieferant</label>
          <input className="input" value={vals.supplier_name} onChange={(e) => update("supplier_name", e.target.value)} />
        </div>
        <div>
          <label className="label">Datum</label>
          <input className="input" type="date" value={vals.receipt_date} onChange={(e) => update("receipt_date", e.target.value)} />
        </div>
        <div>
          <label className="label">Brutto (€)</label>
          <input className="input font-mono" type="number" step="0.01" value={vals.gross_amount} onChange={(e) => update("gross_amount", e.target.value)} />
        </div>
        <div>
          <label className="label">MwSt.</label>
          <Select
            value={vals.vat_rate}
            onChange={(v) => update("vat_rate", v)}
            options={[
              { value: "0", label: "0%" },
              { value: "10", label: "10%" },
              { value: "13", label: "13%" },
              { value: "20", label: "20%" },
            ]}
          />
        </div>
        <div>
          <label className="label">Kategorie</label>
          <Select
            value={vals.category}
            onChange={(v) => update("category", v)}
            options={CATEGORIES}
          />
        </div>
        <div>
          <label className="label">Typ</label>
          <Select
            value={vals.invoice_type}
            onChange={(v) => update("invoice_type", v)}
            options={[
              { value: "eingang", label: "Eingang (Lieferant)" },
              { value: "ausgang", label: "Ausgang (eigene Rechnung)" },
            ]}
          />
        </div>
      </div>
      {ocr.warnings?.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-0.5">
          {(ocr.warnings as string[]).map((w, i) => <p key={i}>⚠ {w}</p>)}
        </div>
      )}
    </div>
  );
}
