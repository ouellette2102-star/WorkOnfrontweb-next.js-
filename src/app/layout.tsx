import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignedIn, UserButton } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import { ConsentProvider } from "@/components/consent-provider";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import { Toaster } from "sonner";
import { isClerkConfigured, logEnvStatus } from "@/lib/env";
import "./globals.css";

export const dynamic = "force-dynamic";

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

// Log env status in development (no values, only presence)
logEnvStatus();

// Check if Clerk is properly configured
const clerkEnabled = isClerkConfigured();
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

/**
 * Fallback layout when Clerk is not configured
 * Shows a non-crashing UI with setup instructions
 */
function FallbackLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CA">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-900 text-white`}
      >
        {/* Setup Warning Banner */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600/90 text-black px-4 py-2 text-center text-sm font-medium">
          ⚠️ Configuration incomplète — 
          <a href="/setup" className="underline ml-1 font-bold">
            Voir les instructions de configuration
          </a>
        </div>
        
        <div className="pt-10">
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            theme="dark"
          />
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // If Clerk is not configured, use fallback layout (no crash)
  if (!clerkEnabled) {
    return <FallbackLayout>{children}</FallbackLayout>;
  }

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
          <Providers>
            <ConsentProvider>{children}</ConsentProvider>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
