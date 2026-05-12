"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatEUR } from "@/lib/utils";

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#0ea5e9",
  "#a3a3a3",
];

function eur(v: number) {
  return formatEUR(v);
}

export function CategoryChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 1)}€`} stroke="#94a3b8" fontSize={11} />
        <YAxis type="category" dataKey="name" stroke="#475569" fontSize={12} width={130} />
        <Tooltip formatter={(v: number) => eur(v)} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyTrendChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ left: 8, right: 16, top: 10 }}>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
        <YAxis tickFormatter={(v) => `${Math.round(v / 1)}€`} stroke="#94a3b8" fontSize={11} />
        <Tooltip formatter={(v: number) => eur(v)} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#2563eb"
          strokeWidth={3}
          dot={{ r: 5, fill: "#2563eb" }}
          activeDot={{ r: 7 }}
          fill="url(#lg)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SupplierChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ left: 0, right: 16, top: 10 }}>
        <CartesianGrid stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" stroke="#475569" fontSize={11} angle={-20} textAnchor="end" height={60} />
        <YAxis tickFormatter={(v) => `${Math.round(v / 1)}€`} stroke="#94a3b8" fontSize={11} />
        <Tooltip formatter={(v: number) => eur(v)} />
        <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusPieChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
