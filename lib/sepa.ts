import type { Receipt } from "./types";

/**
 * SEPA Pain.001.001.03 XML Export — Sammelüberweisung.
 *
 * Erzeugt eine pain.001-XML-Datei, die im Online-Banking als
 * "SEPA-Sammelauftrag" hochgeladen werden kann. Bezahlt alle
 * offenen Rechnungen mit einem Klick.
 *
 * In Produktion: IBAN, BIC, Gläubiger-ID stammen aus User-Settings,
 * IBAN des Lieferanten aus Stammdaten oder OCR-Erkennung.
 */

interface SepaParams {
  debtorName: string;     // Firmenname User
  debtorIban: string;     // IBAN User
  debtorBic?: string;     // BIC User (optional bei SEPA-CT)
  receipts: Receipt[];
  executionDate?: string; // ISO yyyy-mm-dd
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function pad(n: number, w = 2) {
  return String(n).padStart(w, "0");
}

function isoNow(): string {
  const d = new Date();
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

// Pseudo-IBAN für Demo (deterministisch aus Lieferantenname)
function demoIban(supplier: string): string {
  const norm = supplier.toLowerCase().replace(/[^a-z0-9]/g, "");
  let n = 0;
  for (let i = 0; i < norm.length; i++) n = (n * 31 + norm.charCodeAt(i)) >>> 0;
  const acc = String(n).padStart(10, "0").slice(0, 10);
  const blz = "37040044"; // Commerzbank Köln (Demo)
  return `DE${pad((n % 90) + 10)}${blz}${acc}`;
}

export function buildSepaXML(p: SepaParams): string {
  const exec = p.executionDate || new Date().toISOString().slice(0, 10);
  const msgId = `KLARBLICK-${Date.now()}`;
  const pmtInfId = `${msgId}-1`;
  const total = p.receipts.reduce((s, r) => s + r.gross_amount, 0);
  const count = p.receipts.length;
  const created = isoNow();

  const txs = p.receipts
    .map((r, i) => {
      const iban = r.iban || demoIban(r.supplier_name);
      const purpose = `${r.supplier_name} · Beleg ${r.id.slice(0, 8)} · ${r.receipt_date}`;
      const bic = (r as any).supplier_bic || "NOTPROVIDED";
      return `      <CdtTrfTxInf>
        <PmtId>
          <InstrId>KB-${String(i + 1).padStart(4, "0")}</InstrId>
          <EndToEndId>KB-${r.id.slice(0, 20)}</EndToEndId>
        </PmtId>
        <Amt><InstdAmt Ccy="EUR">${r.gross_amount.toFixed(2)}</InstdAmt></Amt>
        <CdtrAgt><FinInstnId><BIC>${xmlEscape(bic)}</BIC></FinInstnId></CdtrAgt>
        <Cdtr><Nm>${xmlEscape(r.supplier_name)}</Nm></Cdtr>
        <CdtrAcct><Id><IBAN>${iban}</IBAN></Id></CdtrAcct>
        <RmtInf><Ustrd>${xmlEscape(purpose)}</Ustrd></RmtInf>
      </CdtTrfTxInf>`;
    })
    .join("\n");

  const bicTag = p.debtorBic
    ? `<DbtrAgt><FinInstnId><BIC>${xmlEscape(p.debtorBic)}</BIC></FinInstnId></DbtrAgt>`
    : `<DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${created}</CreDtTm>
      <NbOfTxs>${count}</NbOfTxs>
      <CtrlSum>${total.toFixed(2)}</CtrlSum>
      <InitgPty><Nm>${xmlEscape(p.debtorName)}</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${pmtInfId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${count}</NbOfTxs>
      <CtrlSum>${total.toFixed(2)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl><Cd>SEPA</Cd></SvcLvl>
        <LclInstrm><Cd>CORE</Cd></LclInstrm>
        <CtgyPurp><Cd>SUPP</Cd></CtgyPurp>
      </PmtTpInf>
      <ReqdExctnDt>${exec}</ReqdExctnDt>
      <Dbtr><Nm>${xmlEscape(p.debtorName)}</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>${p.debtorIban.replace(/\s/g, "")}</IBAN></Id></DbtrAcct>
      ${bicTag}
      <ChrgBr>SLEV</ChrgBr>
${txs}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
}

export function downloadXML(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
