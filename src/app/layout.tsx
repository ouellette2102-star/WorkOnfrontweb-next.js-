import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import { ConsentProvider } from "@/components/consent-provider";
import { AuthGlobalBar } from "@/components/auth-global-bar";
import { Toaster } from "sonner";
import "./globals.css";

// force-dynamic removed — let each page decide its own caching strategy
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WorkOn - Uber du travail",
  description:
    "Marketplace qui connecte clients et travailleurs autonomes avec matching instantané",
  keywords: ["travail", "marketplace", "travailleurs autonomes", "missions"],
};

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

const clerkConfigured =
  clerkPublishableKey.startsWith("pk_test_") ||
  clerkPublishableKey.startsWith("pk_live_");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Clerk not configured — bare layout, no auth crash
  if (!clerkConfigured) {
    return (
      <html lang="fr-CA">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-900 text-white`}
        >
          <Toaster position="top-right" richColors closeButton theme="dark" />
          <Providers>{children}</Providers>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <html lang="fr-CA">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-900 text-white`}
        >
          {/*
           * AuthGlobalBar is a "use client" component — uses useAuth() client-side.
           * Never calls auth() server-side, so it works without CLERK_SECRET_KEY.
           */}
          <AuthGlobalBar />

          <Toaster position="top-right" richColors closeButton theme="dark" />

          <Providers>
            <ConsentProvider>{children}</ConsentProvider>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
