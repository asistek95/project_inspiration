"use client";

import type { Receipt } from "@/lib/types";
import { formatEUR, formatDate } from "@/lib/utils";

/**
 * ReceiptPaper — visualisiert einen Beleg im Stil eines echten Kassenbons:
 * cremefarbenes Papier, leichte Drehung, weiche Schatten, Monospace-Schrift,
 * gestrichelte Trennlinien und gezackte Unterkante.
 */
export function ReceiptPaper({
  receipt,
  tilt = 0,
  className = "",
}: {
  receipt: Receipt;
  tilt?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative mx-auto max-w-xs ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div
        className="relative bg-[#fdfaf2] text-slate-800 font-mono text-[11px] leading-snug px-5 pt-5 pb-6 shadow-[0_18px_40px_-12px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.015) 0px, rgba(0,0,0,0.015) 1px, transparent 1px, transparent 3px)",
        }}
      >
        <div className="text-center">
          <p className="font-bold text-sm tracking-wide uppercase">{receipt.supplier_name}</p>
          <p className="text-[10px] text-slate-500">Steuer-Nr. 12/345/67890</p>
          <p className="text-[10px] text-slate-500">{formatDate(receipt.receipt_date)} · 14:23</p>
        </div>
        <Dashed />
        <div className="space-y-1">
          <Row label={receipt.receipt_type} value="" />
          <Row label="Position 1" value={formatEUR(receipt.gross_amount * 0.6)} />
          <Row label="Position 2" value={formatEUR(receipt.gross_amount * 0.4)} />
        </div>
        <Dashed />
        <div className="space-y-1">
          <Row label="Netto" value={formatEUR(receipt.net_amount)} />
          <Row
            label={
              receipt.vat_amount === 0 && receipt.net_amount > 0
                ? "0% USt (§19 RC)"
                : receipt.category === "Bewirtung"
                ? "MwSt. 10 %"
                : receipt.category === "Versicherungen"
                ? "steuerfrei §6"
                : "MwSt. 20 %"
            }
            value={formatEUR(receipt.vat_amount)}
          />
          <Row label="SUMME" value={formatEUR(receipt.gross_amount)} bold />
        </div>
        <Dashed />
        <div className="text-center text-[10px] text-slate-500">
          <p>Zahlung: {receipt.payment_method}</p>
          <p className="mt-1">Vielen Dank für Ihren Einkauf.</p>
        </div>
        {/* Gezackte Unterkante */}
        <div
          className="absolute left-0 right-0 -bottom-2 h-3"
          style={{
            background: "#fdfaf2",
            WebkitMaskImage:
              "linear-gradient(#000,#000), radial-gradient(circle at 6px 0, transparent 4px, #000 4px)",
            WebkitMaskComposite: "source-out",
            maskImage:
              "radial-gradient(circle at 6px 0, transparent 4px, #000 4px)",
            maskSize: "12px 12px",
            maskRepeat: "repeat-x",
          }}
        />
      </div>
    </div>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${bold ? "font-bold text-[12px]" : ""}`}>
      <span className="truncate">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function Dashed() {
  return (
    <div
      className="my-2 h-px"
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, rgba(15,23,42,0.4) 0 4px, transparent 4px 8px)",
      }}
    />
  );
}
