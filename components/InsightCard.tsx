import type { Insight } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, Sparkles, Flame } from "lucide-react";

export function InsightCard({ insight }: { insight: Insight }) {
  const map = {
    low: {
      Icon: Sparkles,
      iconCls: "text-brand-600 bg-brand-50",
      borderCls: "border-l-brand-500",
    },
    medium: {
      Icon: AlertTriangle,
      iconCls: "text-warn bg-warn-soft",
      borderCls: "border-l-warn",
    },
    high: {
      Icon: Flame,
      iconCls: "text-danger bg-danger-soft",
      borderCls: "border-l-danger",
    },
  } as const;
  const { Icon, iconCls, borderCls } = map[insight.severity];
  return (
    <div className={cn("card p-4 border-l-4 flex gap-3", borderCls)}>
      <span className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", iconCls)}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-snug">{insight.title}</p>
        <p className="text-sm text-muted-foreground leading-snug mt-0.5">{insight.description}</p>
        {insight.action ? (
          <p className="text-xs mt-2 text-brand-700 font-medium">→ {insight.action}</p>
        ) : null}
      </div>
    </div>
  );
}
