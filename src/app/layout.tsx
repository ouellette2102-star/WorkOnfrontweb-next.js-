import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  themeColor: "#FF4D1C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr-CA">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Toaster position="top-right" richColors closeButton theme="dark" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
