import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  Icon?: LucideIcon;
  accent?: "brand" | "accent" | "warn" | "danger" | "muted";
  trend?: { value: number; up?: boolean };
  className?: string;
}

export function MetricCard({ label, value, hint, Icon, accent = "brand", trend, className }: MetricCardProps) {
  const accents: Record<string, string> = {
    brand: "text-brand-600 bg-brand-50",
    accent: "text-accent bg-accent-soft",
    warn: "text-warn bg-warn-soft",
    danger: "text-danger bg-danger-soft",
    muted: "text-slate-600 bg-slate-100",
  };
  return (
    <div className={cn("card p-5 flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon ? (
          <span className={cn("rounded-md p-1.5", accents[accent])}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="flex items-center gap-2 text-xs">
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium",
              trend.up ? "bg-danger-soft text-danger" : "bg-accent-soft text-accent"
            )}
          >
            {trend.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend.value)} %
          </span>
        ) : null}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}
