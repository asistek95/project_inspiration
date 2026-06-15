"use client";

import { useRef, useState } from "react";
import { Play, Pause, HardHat, Phone, FileText, CalendarClock } from "lucide-react";

export function DemoVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); setStarted(true); }
    else { v.pause(); setPlaying(false); }
  }

  return (
    <div className="relative">
      <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200 bg-slate-900">
        <video
          ref={ref}
          src="/video/handwerker-tag.mp4"
          className="w-full h-auto block aspect-video object-cover"
          playsInline
          preload="metadata"
          muted
          loop
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        {/* Story strip — bottom overlay, always visible */}
        <div className="absolute bottom-0 left-0 right-0 z-20 grid grid-cols-3 divide-x divide-white/10">
          {[
            { Icon: Phone, label: "Ständig Telefon" },
            { Icon: FileText, label: "Belege stapeln sich" },
            { Icon: CalendarClock, label: "Monatsabschluss?" },
          ].map(({ Icon, label }) => (
            <div key={label} className="flex items-center justify-center gap-1.5 py-2 bg-slate-900/75 backdrop-blur-sm">
              <Icon className="h-3.5 w-3.5 text-brand-300 shrink-0" />
              <span className="text-[11px] font-medium text-white">{label}</span>
            </div>
          ))}
        </div>

        {/* "Kennst du das?" bubble — top-right corner, visible when not playing */}
        {!playing && (
          <div className="absolute top-3 right-3 z-30 w-[175px] bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg ring-1 ring-slate-200/60 pointer-events-none">
            <div className="flex items-start gap-2">
              <span className="h-8 w-8 rounded-lg bg-brand-50 text-brand-700 grid place-content-center shrink-0">
                <HardHat className="h-4 w-4" />
              </span>
              <div className="text-xs leading-snug">
                <p className="font-semibold text-slate-900">Kennst du das?</p>
                <p className="text-slate-500 mt-0.5 text-[11px]">Belege stapeln sich, Telefon klingelt — Monat fehlt.</p>
              </div>
            </div>
          </div>
        )}

        {/* Play overlay — before first start */}
        {!started && (
          <button
            onClick={toggle}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/50 group"
            aria-label="Video abspielen"
          >
            <span className="h-20 w-20 rounded-full bg-white/95 grid place-content-center shadow-2xl transition group-hover:scale-110">
              <Play className="h-8 w-8 text-brand-600 ml-1" fill="currentColor" />
            </span>
            <div className="absolute bottom-12 left-5 right-5 text-center">
              <p className="text-white font-bold text-lg leading-tight drop-shadow-lg">
                Ein Tag im Leben eines Selbständigen
              </p>
              <p className="text-white/80 text-sm mt-1 drop-shadow">
                Telefon · Baustelle · Belege · „Wann ist eigentlich Monatsabschluss?"
              </p>
            </div>
          </button>
        )}

        {/* Pause / resume button after first play */}
        {started && (
          <button
            onClick={toggle}
            className="absolute bottom-12 right-3 z-30 h-10 w-10 rounded-full bg-white/90 backdrop-blur grid place-content-center shadow-lg hover:bg-white transition"
            aria-label={playing ? "Pause" : "Abspielen"}
          >
            {playing
              ? <Pause className="h-4 w-4" />
              : <Play className="h-4 w-4 ml-0.5" fill="currentColor" />}
          </button>
        )}
      </div>
    </div>
  );
}
