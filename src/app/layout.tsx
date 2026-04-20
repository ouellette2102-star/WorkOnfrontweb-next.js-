import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { CookieConsent } from "@/components/cookie-consent";
import { Toaster } from "sonner";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://workonapp.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
  maximumScale: 1,
  userScalable: false,
  themeColor: "#134021",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr-CA" suppressHydrationWarning>
      <body
        className={`${manrope.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <Toaster position="top-right" richColors closeButton theme="system" />
          <Providers>{children}</Providers>
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
