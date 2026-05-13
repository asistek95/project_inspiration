import Link from "next/link";

export const metadata = { title: "Impressum · Klarblick" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg flex items-center gap-2">
            <img src="/klar.png" alt="Klarblick" className="h-9 w-9 object-contain" />
            Klarblick
          </Link>
          <Link href="/" className="text-sm text-slate-600 hover:text-foreground">Zurück</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-12 prose prose-slate">
        {children}
      </main>
    </div>
  );
}
