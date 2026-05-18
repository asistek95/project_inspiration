"use client";

import React from "react";

/**
 * Sehr leichter Markdown-Renderer für die AI-Report-Ausgabe.
 * Unterstützt: # / ## / ### Headings, **bold**, *italic*, `code`,
 * - / * bullets, 1. nummerierte Listen, --- HR, Absätze.
 */
export function Markdown({ source }: { source: string }) {
  const blocks = splitBlocks(source);
  return (
    <div className="space-y-3 text-[0.93rem] leading-relaxed text-slate-700">
      {blocks.map((b, i) => renderBlock(b, i))}
    </div>
  );
}

type Block =
  | { type: "h"; level: 1 | 2 | 3 | 4; text: string }
  | { type: "hr" }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "p"; text: string };

function splitBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^---+\s*$/.test(line)) {
      out.push({ type: "hr" });
      i++;
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      out.push({ type: "h", level: h[1].length as 1 | 2 | 3 | 4, text: h[2].trim() });
      i++;
      continue;
    }
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*•]\s+/, ""));
        i++;
      }
      out.push({ type: "ul", items });
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      out.push({ type: "ol", items });
      continue;
    }
    // paragraph: zieh zusammen bis Leerzeile
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,4}\s+/.test(lines[i]) &&
      !/^\s*[-*•]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^---+\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    out.push({ type: "p", text: buf.join(" ") });
  }
  return out;
}

function renderBlock(b: Block, key: number) {
  switch (b.type) {
    case "h": {
      const cls =
        b.level === 1
          ? "text-2xl font-bold tracking-tight text-slate-900 mt-5"
          : b.level === 2
            ? "text-xl font-semibold tracking-tight text-brand-700 mt-4"
            : b.level === 3
              ? "text-base font-semibold text-slate-900 mt-3"
              : "text-sm font-semibold text-slate-800 mt-2";
      const Tag = (`h${b.level}` as unknown) as keyof JSX.IntrinsicElements;
      return (
        <Tag key={key} className={cls}>
          {inline(b.text)}
        </Tag>
      );
    }
    case "hr":
      return <hr key={key} className="border-slate-200 my-2" />;
    case "ul":
      return (
        <ul key={key} className="list-disc pl-5 space-y-1 marker:text-brand-600">
          {b.items.map((t, i) => (
            <li key={i}>{inline(t)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={key} className="list-decimal pl-5 space-y-1 marker:text-brand-700 marker:font-semibold">
          {b.items.map((t, i) => (
            <li key={i}>{inline(t)}</li>
          ))}
        </ol>
      );
    case "p":
      return (
        <p key={key} className="text-slate-700">
          {inline(b.text)}
        </p>
      );
  }
}

function inline(text: string): React.ReactNode {
  // **bold**, *italic*, `code`
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-slate-900">
          {tok.slice(2, -2)}
        </strong>
      );
    } else if (tok.startsWith("`")) {
      parts.push(
        <code key={key++} className="px-1 py-0.5 rounded bg-slate-100 text-[0.85em] text-brand-700">
          {tok.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(
        <em key={key++} className="italic text-slate-800">
          {tok.slice(1, -1)}
        </em>
      );
    }
    lastIdx = m.index + tok.length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return <>{parts}</>;
}
