import { cn } from "@/lib/utils";
import type { ReceiptStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import { CheckCircle2, AlertTriangle, Circle, Send } from "lucide-react";

export function StatusBadge({ status, className }: { status: ReceiptStatus; className?: string }) {
  const map: Record<ReceiptStatus, { cls: string; Icon: any }> = {
    geprueft: { cls: "bg-accent-soft text-accent border-emerald-200", Icon: CheckCircle2 },
    unsicher: { cls: "bg-warn-soft text-warn border-amber-200", Icon: AlertTriangle },
    ungeprueft: { cls: "bg-slate-100 text-slate-600 border-slate-200", Icon: Circle },
    freigegeben: { cls: "bg-brand-50 text-brand-700 border-blue-200", Icon: Send },
  };
  const { cls, Icon } = map[status];
  return (
    <span className={cn("pill border", cls, className)}>
      <Icon className="h-3.5 w-3.5" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ConfidenceBadge({ value, className }: { value: number; className?: string }) {
  const pct = Math.round(value * 100);
  const tier = value >= 0.9 ? "high" : value >= 0.7 ? "medium" : "low";
  const cls =
    tier === "high"
      ? "bg-accent-soft text-accent border-emerald-200"
      : tier === "medium"
        ? "bg-warn-soft text-warn border-amber-200"
        : "bg-danger-soft text-danger border-red-200";
  const label = tier === "high" ? "Hohe Sicherheit" : tier === "medium" ? "Prüfung empfohlen" : "Unsicher";
  return (
    <span className={cn("pill border", cls, className)}>
      <span className="font-semibold">{pct}%</span>
      <span className="opacity-80">· {label}</span>
    </span>
  );
}
