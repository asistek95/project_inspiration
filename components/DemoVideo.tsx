"use client";

import { useRef, useState } from "react";
import { Play, Pause, HardHat, Phone, FileText, CalendarClock } from "lucide-react";

/**
 * Hero-Visual — Story-Video eines typischen Handwerker-Tags.
 * Ersetzt die alte Mock-Karussell-Animation.
 */
export function DemoVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
      setStarted(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="relative pt-2 lg:pt-0 lg:pr-[300px]">
      {/* Story-Karte außerhalb rechts — nicht mehr über dem Video */}
      <div className="hidden lg:block absolute right-0 top-0 w-[280px] card-soft p-4 shadow-lg ring-1 ring-slate-200 bg-white">
        <div className="flex items-start gap-3">
          <span className="h-9 w-9 rounded-lg bg-brand-50 text-brand-700 grid place-content-center shrink-0">
            <HardHat className="h-5 w-5" />
          </span>
          <div className="text-sm leading-snug">
            <p className="font-semibold text-foreground">Kennst du das?</p>
            <p className="text-slate-600 mt-1 text-[13px]">
              Du bist Handwerker, hast 10 Leute auf der Baustelle, das Telefon klingelt
              im Minutentakt — und irgendwo dazwischen stapeln sich die Belege.
            </p>
          </div>
        </div>
      </div>

      {/* Video */}
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

        {/* Play-Overlay vor Start */}
        {!started ? (
          <button
            onClick={toggle}
            className="absolute inset-0 grid place-content-center bg-gradient-to-br from-slate-900/40 via-slate-900/20 to-slate-900/60 group"
            aria-label="Video abspielen"
          >
            <span className="h-20 w-20 rounded-full bg-white/95 grid place-content-center shadow-2xl transition group-hover:scale-110">
              <Play className="h-8 w-8 text-brand-600 ml-1" fill="currentColor" />
            </span>
            <span className="absolute bottom-5 left-5 right-5 text-center">
              <p className="text-white font-bold text-lg leading-tight drop-shadow-lg">
                Ein Tag im Leben eines Selbständigen
              </p>
              <p className="text-white/90 text-sm mt-1 drop-shadow-lg">
                Telefon · Baustelle · Belege · „Wann ist eigentlich Monatsabschluss?"
              </p>
            </span>
          </button>
        ) : (
          <button
            onClick={toggle}
            className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-white/90 backdrop-blur grid place-content-center shadow-lg hover:bg-white transition"
            aria-label={playing ? "Pause" : "Abspielen"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" fill="currentColor" />}
          </button>
        )}
      </div>

      {/* Story-Punkte unter dem Video */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { Icon: Phone, label: "Ständig Telefon" },
          { Icon: FileText, label: "Belege stapeln sich" },
          { Icon: CalendarClock, label: "Monatsabschluss?" },
        ].map(({ Icon, label }) => (
          <div key={label} className="rounded-lg border border-border bg-white px-2 py-2.5 flex items-center justify-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-brand-600 shrink-0" />
            <span className="text-[11px] font-medium text-slate-700">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
