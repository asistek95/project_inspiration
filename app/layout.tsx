import type { Metadata } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: "Klarblick – Management Reports & Steuerberater-Vorbereitung für Handwerksbetriebe",
  description:
    "Klarblick automatisiert deinen Monats-Management-Report und reduziert den Aufwand für den Steuerberater — mit KI-Auswertung, klaren Kennzahlen und fertiger Checkliste. Bis zu 70 % weniger Vorbereitungszeit.",
  metadataBase: new URL("https://klarblick.com"),
  icons: {
    icon: "/klar.png",
    shortcut: "/klar.png",
    apple: "/klar.png",
  },
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
      <body className="min-h-screen font-sans antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
