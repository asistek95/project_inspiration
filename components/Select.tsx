"use client";

import { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label?: string;
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: (SelectOption | string)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Bitte wählen …",
  disabled,
  className,
  id,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId();

  const normalized: SelectOption[] = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  const selected = normalized.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className ?? ""}`} id={id ?? uid}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={[
          "input text-left flex items-center justify-between gap-2 w-full",
          disabled ? "opacity-60 cursor-not-allowed bg-slate-50 pointer-events-none" : "cursor-pointer",
          open ? "border-brand-500 ring-2 ring-brand-100" : "",
        ].join(" ")}
      >
        <span className={selected ? "text-foreground font-medium" : "text-slate-400 font-normal"}>
          {selected ? (selected.label ?? selected.value) : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          className="absolute z-[60] top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
          style={{ boxShadow: "0 8px 24px rgba(16,24,40,0.10)" }}
        >
          <div className="max-h-64 overflow-y-auto py-1.5">
            {normalized.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={[
                    "w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors",
                    active
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50 font-normal",
                  ].join(" ")}
                >
                  <span>{o.label ?? o.value}</span>
                  {active && <Check className="h-4 w-4 text-brand-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
