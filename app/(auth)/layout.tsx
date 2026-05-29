import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white">
        <Link href="/" className="font-bold text-xl flex items-center gap-2">
          <img src="/klar.png" alt="Klarblick" className="h-10 w-10 object-contain bg-white/15 rounded-lg p-1" />
          Klarblick
        </Link>
        <div>
          <p className="text-3xl font-extrabold leading-tight max-w-md">
            „Mein Monat ist bis zum 15. fertig.“
          </p>
          <p className="mt-4 text-white/80 max-w-md">
            Belege rein. Monat bis zum 15. steuerberaterbereit. Dein digitaler Monatsabschluss-Assistent.
          </p>
        </div>
        <p className="text-xs text-white/60">
          Klarblick ersetzt keine Steuerberatung. Erkannte Daten müssen geprüft werden.
        </p>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-10 bg-white">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
