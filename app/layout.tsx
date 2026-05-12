import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Klarblick – Aus Chaos wird Unternehmerklarheit",
  description:
    "Klarblick verwandelt Belege automatisch in Management-Reports und klare Einblicke für Unternehmen — und ein sauberes Paket für den Steuerberater.",
  metadataBase: new URL("https://klarblick.app"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
