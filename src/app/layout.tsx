import type { Metadata, Viewport } from "next";
import { Manrope, Bricolage_Grotesque } from "next/font/google";
import { Providers } from "@/components/providers";
import { MaintenanceGate } from "@/components/remote-config/maintenance-gate";
import { CookieConsent } from "@/components/cookie-consent";
import { Toaster } from "sonner";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Bricolage Grotesque — free open-source display grotesque that stands
 * in for Cabinet Grotesk (which the `.font-heading` class referenced but
 * was never actually loaded, so headings quietly fell back to Manrope).
 * Variable font so we get 400-800 without multiple weight requests.
 */
const bricolage = Bricolage_Grotesque({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  title: "WorkOn — Une ligne directe vers le travail instantané",
  description:
    "Marketplace qui connecte clients et professionnels vérifiés. Réservez en 1 tap, paiement sécurisé par Stripe.",
  keywords: [
    "travail",
    "marketplace",
    "professionnels",
    "missions",
    "Québec",
    "travailleurs autonomes",
    "services à domicile",
  ],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "fr_CA",
    siteName: "WorkOn",
    title: "WorkOn — Une ligne directe vers le travail instantané",
    description:
      "Missions payées rapidement. Travailleurs vérifiés. Paiement sécurisé par Stripe.",
  },
  twitter: {
    card: "summary_large_image",
    title: "WorkOn — Une ligne directe vers le travail instantané",
    description:
      "Missions payées rapidement. Travailleurs vérifiés. Paiement sécurisé par Stripe.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#134021",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr-CA">
      <body
        className={`${manrope.variable} ${bricolage.variable} antialiased bg-background text-foreground`}
      >
        <Toaster position="top-right" richColors closeButton theme="light" />
        <Providers>
          <MaintenanceGate>{children}</MaintenanceGate>
        </Providers>
        <CookieConsent />
      </body>
    </html>
  );
}
