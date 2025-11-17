"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StripeOnboardingRefreshPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger immédiatement vers la page payments
    router.push("/worker/payments");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
        <p className="text-white/70">Redirection...</p>
      </div>
    </div>
  );
}

