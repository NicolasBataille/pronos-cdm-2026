import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pronos CDM 2026 ⚽",
  description: "Le championnat de pronostics entre potes pour la Coupe du Monde",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Applique le thème stocké avant le 1er paint (évite tout flash de couleur)
const themeScript = `(function(){try{var t=localStorage.getItem('cdm-theme')||'ardoise';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='ardoise';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased grain">{children}</body>
    </html>
  );
}
