import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignedIn, UserButton } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import { NotificationBadge } from "@/components/notifications/notification-badge";
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
  title: "WorkOn - Uber du travail",
  description: "Marketplace qui connecte clients et travailleurs autonomes avec matching instantané",
  keywords: ["travail", "marketplace", "travailleurs autonomes", "missions"],
};

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY est manquante. Vérifie ton fichier .env.local.",
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      appearance={{
        variables: {
          colorPrimary: "#dc2626",
          colorBackground: "#0c0c0c",
        },
        elements: {
          formButtonPrimary:
            "bg-red-600 hover:bg-red-500 text-white shadow shadow-red-900/40",
        },
      }}
    >
      <html lang="fr-CA">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-900 text-white`}
        >
          <SignedIn>
            <div className="pointer-events-none fixed right-4 top-3 z-50 flex items-center justify-end">
              <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-2 py-2 shadow-lg shadow-black/40 backdrop-blur">
                <NotificationBadge />
                <span className="hidden text-sm text-white/70 md:inline px-2">
                  Mon espace
                </span>
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "ring-2 ring-red-600",
                      userButtonPopoverCard: "bg-neutral-900 border border-white/10 text-white",
                      userButtonPopoverActionButtonIcon: "text-white/80",
                      userButtonPopoverActionButtonText: "text-white/80",
                    },
                  }}
                  afterSignOutUrl="/"
                />
              </div>
            </div>
          </SignedIn>

          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            theme="dark"
          />
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}