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

export const metadata: Metadata = {
  title: "WorkOn - Trouvez votre talent",
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
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
